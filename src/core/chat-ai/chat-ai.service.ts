import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import axios from 'axios';
import Redis from 'ioredis';
import { randomUUID } from 'crypto';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { InsightDto, INSIGHT_RESPONSE_FORMAT } from './insight.dto';
import { SALES_CONSULTANT_PROMPT } from './prompts/sales-consultant';

@Injectable()
export class ChatAiService {
  private readonly logger = new Logger(ChatAiService.name);
  private running = false;
  private readonly queue = 'crm:ai:pending';
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}
  private get enabled() {
    return !!(
      process.env.CHAT_AI_URL &&
      process.env.CHAT_AI_MODEL &&
      process.env.CHAT_AI_API_KEY
    );
  }
  private async chat(storeId: string, chatId: string) {
    const chat = await this.prisma.chat.findFirst({
      where: { id: chatId, storeId },
    });
    if (!chat) throw new NotFoundException('Chat not found');
    return chat;
  }
  async get(storeId: string, chatId: string) {
    const chat = await this.chat(storeId, chatId);
    return {
      enabled: this.enabled,
      insight: chat.aiInsight,
      analyzedAt: chat.aiAnalyzedAt,
    };
  }
  async refresh(storeId: string, chatId: string) {
    await this.chat(storeId, chatId);
    if (!this.enabled)
      throw new ServiceUnavailableException(
        'Chat AI provider is not configured',
      );
    await this.enqueue(storeId, chatId);
    return { queued: true };
  }
  private enqueue(storeId: string, chatId: string) {
    return this.redis.zadd(
      this.queue,
      Date.now(),
      JSON.stringify({ storeId, chatId }),
    );
  }
  @OnEvent('chat.message.received', { async: true, suppressErrors: true })
  async incoming(event: {
    storeId: string;
    chatId: string;
    message: { sender: string };
  }) {
    if (this.enabled && event.message.sender === 'CUSTOMER')
      await this.enqueue(event.storeId, event.chatId);
  }
  @Cron('*/2 * * * * *')
  async processQueue() {
    if (!this.enabled || this.running) return;
    this.running = true;
    try {
      const jobs = await this.redis.zrangebyscore(
        this.queue,
        0,
        Date.now(),
        'LIMIT',
        0,
        5,
      );
      for (const job of jobs) {
        const { storeId, chatId } = JSON.parse(job);
        const lock = `crm:ai:lock:${storeId}:${chatId}`,
          owner = randomUUID();
        if ((await this.redis.set(lock, owner, 'EX', 90, 'NX')) !== 'OK')
          continue;
        const claimTime = Date.now() + 90000;
        await this.redis.zadd(this.queue, claimTime, job);
        try {
          await this.analyze(storeId, chatId);
          await this.redis.eval(
            'if redis.call("zscore", KEYS[1], ARGV[1]) == ARGV[2] then return redis.call("zrem", KEYS[1], ARGV[1]) end return 0',
            1,
            this.queue,
            job,
            String(claimTime),
          );
        } catch (error) {
          if (error instanceof NotFoundException)
            await this.redis.zrem(this.queue, job);
          else {
            this.logger.warn(
              `Analysis failed for chat ${chatId}; retry scheduled`,
            );
            await this.redis.zadd(this.queue, Date.now() + 60000, job);
          }
        } finally {
          await this.redis.eval(
            'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) end return 0',
            1,
            lock,
            owner,
          );
        }
      }
    } catch {
      this.logger.error('AI queue is unavailable');
    } finally {
      this.running = false;
    }
  }
  private async analyze(storeId: string, chatId: string) {
    const chat = await this.chat(storeId, chatId);
    const messages = await this.prisma.message.findMany({
      where: { chatId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 15,
      select: { id: true, sender: true, content: true, createdAt: true },
    });
    if (!messages.length) return;
    const response = await axios.post(
      process.env.CHAT_AI_URL,
      {
        model: process.env.CHAT_AI_MODEL,
        messages: [
          { role: 'system', content: SALES_CONSULTANT_PROMPT },
          {
            role: 'user',
            content: JSON.stringify({
              externalAdId: chat.externalAdId,
              messages: [...messages].reverse().map((message) => ({
                sender: message.sender,
                text: message.content?.slice(0, 6000),
              })),
            }),
          },
        ],
        response_format: INSIGHT_RESPONSE_FORMAT,
        temperature: 0.2,
      },
      {
        headers: { Authorization: `Bearer ${process.env.CHAT_AI_API_KEY}` },
        timeout: 45000,
        maxContentLength: 100000,
      },
    );
    const raw = JSON.parse(response.data.choices?.[0]?.message?.content);
    if (!raw?.leadDossier) throw new Error('Missing dossier');
    const insight = plainToInstance(InsightDto, raw);
    await validateOrReject(insight, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    const latest = await this.prisma.message.findFirst({
      where: { chatId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
    if (latest?.id !== messages[0].id) {
      await this.enqueue(storeId, chatId);
      return;
    }
    const analyzedAt = new Date();
    await this.prisma.chat.update({
      where: { id: chatId, storeId },
      data: {
        aiInsight: raw as Prisma.InputJsonValue,
        aiAnalyzedAt: analyzedAt,
      },
    });
    await this.redis.set(
      `crm:ai:insight:${storeId}:${chatId}`,
      JSON.stringify({ insight: raw, analyzedAt }),
      'EX',
      3600,
    );
    this.events.emit('chat.ai.ready', {
      storeId,
      chatId,
      insight: raw,
      analyzedAt,
    });
  }
}
