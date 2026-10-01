import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, InboundEvent } from '@prisma/client';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { IncomingEventDto, MessageAckDto } from './incoming.dto';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);
  private draining = false;
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}
  async accept(input: IncomingEventDto, kind = 'message') {
    if (!input.text && !input.attachmentUrl && kind !== 'lead')
      throw new BadRequestException('Message content is required');
    const store = await this.prisma.store.findUnique({
      where: { id: input.storeId },
      select: { id: true },
    });
    if (!store) throw new NotFoundException('Store not found');
    const event = await this.prisma.inboundEvent.upsert({
      where: {
        storeId_eventId_kind: {
          storeId: input.storeId,
          eventId: input.eventId,
          kind,
        },
      },
      update: {},
      create: {
        storeId: input.storeId,
        eventId: input.eventId,
        kind,
        payload: input as unknown as Prisma.InputJsonValue,
      },
    });
    void this.drain();
    return { accepted: true, eventId: event.eventId };
  }
  @Cron('*/5 * * * * *')
  async drain() {
    if (this.draining) return;
    this.draining = true;
    try {
      const events = await this.prisma.inboundEvent.findMany({
        where: {
          status: { in: ['PENDING', 'PROCESSING'] },
          availableAt: { lte: new Date() },
        },
        orderBy: { createdAt: 'asc' },
        take: 25,
      });
      for (const event of events) {
        const claim = await this.prisma.inboundEvent.updateMany({
          where: {
            id: event.id,
            status: event.status,
            availableAt: event.availableAt,
          },
          data: {
            status: 'PROCESSING',
            availableAt: new Date(Date.now() + 60000),
            attempts: { increment: 1 },
          },
        });
        if (!claim.count) continue;
        try {
          await this.process(event);
        } catch {
          this.logger.error(
            `Inbound event ${event.id} failed; retry scheduled`,
          );
          await this.prisma.inboundEvent.update({
            where: { id: event.id },
            data: {
              status: 'PENDING',
              availableAt: new Date(
                Date.now() +
                  Math.min(300000, 1000 * 2 ** Math.min(event.attempts, 8)),
              ),
            },
          });
        }
      }
    } catch {
      this.logger.error('Unable to process inbound queue');
    } finally {
      this.draining = false;
    }
  }
  private async process(event: InboundEvent) {
    const input = event.payload as unknown as IncomingEventDto;
    const result = await this.prisma.$transaction(
      async (tx) => {
        const duplicate = await tx.message.findFirst({
          where: {
            externalMessageId: input.externalMessageId,
            channel: input.channel,
            chat: { storeId: input.storeId },
          },
        });
        if (duplicate) {
          await tx.inboundEvent.update({
            where: { id: event.id },
            data: { status: 'DONE' },
          });
          return null;
        }
        let customer = await tx.temporaryCustomer.findFirst({
          where: {
            storeId: input.storeId,
            externalContactId: input.externalContactId,
            channel: input.channel,
          },
        });
        if (!customer)
          customer = await tx.temporaryCustomer.create({
            data: {
              storeId: input.storeId,
              externalContactId: input.externalContactId,
              channel: input.channel,
              name: input.name,
            },
          });
        let chat = await tx.chat.findFirst({
          where: {
            storeId: input.storeId,
            channel: input.channel,
            externalRecipientId: input.externalContactId,
          },
          orderBy: { createdAt: 'desc' },
        });
        let newDeal = null;
        if (!chat?.dealId)
          newDeal = await tx.deal.create({
            data: {
              storeId: input.storeId,
              temporaryCustomerId: customer.id,
              dealOrigin: input.channel,
              temperature: 'WARM',
              status: 'chat',
              title: input.name || input.externalContactId,
            },
          });
        if (!chat)
          chat = await tx.chat.create({
            data: {
              storeId: input.storeId,
              temporaryCustomerId: customer.id,
              channel: input.channel,
              externalRecipientId: input.externalContactId,
              dealId: newDeal.id,
              externalAdId: input.externalAdId,
            },
          });
        else if (newDeal)
          chat = await tx.chat.update({
            where: { id: chat.id },
            data: { dealId: newDeal.id },
          });
        const message = await tx.message.create({
          data: {
            chatId: chat.id,
            externalRecipientId: input.externalContactId,
            externalMessageId: input.externalMessageId,
            channel: input.channel,
            content: input.text,
            attachmentUrl: input.attachmentUrl,
            attachmentType: input.attachmentType,
            quotedMessageId: input.quotedMessageId,
            sender: input.sentByStore ? 'STORE' : 'CUSTOMER',
            isRead: !!input.sentByStore,
            createdAt: new Date(input.timestamp),
            deliveryStatus: 'DELIVERED',
          },
        });
        await tx.chat.update({
          where: { id: chat.id },
          data: {
            archived: false,
            ...(input.externalAdId ? { externalAdId: input.externalAdId } : {}),
            ...(!input.sentByStore
              ? { lastMessageCustomerAt: new Date(input.timestamp) }
              : {}),
          },
        });
        await tx.inboundEvent.update({
          where: { id: event.id },
          data: { status: 'DONE' },
        });
        return { message, newDeal };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    if (!result) return;
    const payload = {
      storeId: input.storeId,
      chatId: result.message.chatId,
      message: result.message,
    };
    this.events.emit('chat.message.received', payload);
    if (result.newDeal)
      this.events.emit('chat.deal.created', {
        storeId: input.storeId,
        deal: result.newDeal,
      });
  }
  async acknowledge(input: MessageAckDto) {
    return this.prisma
      .$transaction(
        async (tx) => {
          const message = await tx.message.findFirst({
            where: { id: input.messageId, chat: { storeId: input.storeId } },
          });
          if (!message) throw new NotFoundException('Message not found');
          const rank = {
            PENDING: 0,
            FAILED: 0,
            SENT: 1,
            DELIVERED: 2,
            READ: 3,
          };
          if (rank[input.status] < (rank[message.deliveryStatus] ?? 0))
            return message;
          const updated = await tx.message.update({
            where: { id: message.id },
            data: {
              deliveryStatus: input.status,
              ...(input.externalMessageId
                ? { externalMessageId: input.externalMessageId }
                : {}),
            },
          });
          return updated;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      )
      .then((message) => {
        this.events.emit('chat.message.status', {
          storeId: input.storeId,
          chatId: message.chatId,
          message,
        });
        return message;
      });
  }
}
