import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth/auth.service';
import { Inject } from '@nestjs/common';
import Redis from 'ioredis';

@WebSocketGateway({
  namespace: '/chats',
  cors: {
    origin: (origin, callback) =>
      callback(
        null,
        !origin ||
          origin === (process.env.FRONTEND_URL || 'http://localhost:3000'),
      ),
    credentials: true,
  },
})
@Injectable()
export class ChatGateway
  implements OnGatewayConnection, OnModuleInit, OnModuleDestroy
{
  @WebSocketServer() server: Server;
  private subscriber: Redis;
  constructor(
    private readonly jwt: JwtService,
    private readonly auth: AuthService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}
  async onModuleInit() {
    this.subscriber = this.redis.duplicate();
    this.subscriber.on('message', (channel, raw) => {
      if (channel !== 'crm:realtime') return;
      try {
        const { storeId, event, payload } = JSON.parse(raw);
        this.server?.to(`store:${storeId}`).emit(event, payload);
      } catch {
        /* Invalid internal events are ignored. */
      }
    });
    await this.subscriber.subscribe('crm:realtime');
  }
  async onModuleDestroy() {
    await this.subscriber?.quit();
  }
  async handleConnection(socket: Socket) {
    try {
      const token = socket.handshake.auth?.token;
      if (typeof token !== 'string') throw new Error('Missing token');
      const payload = await this.jwt.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
      if (!payload.exp || payload.reset) throw new Error('Invalid session');
      const user = await this.auth.validateAuth(payload);
      if (!user?.storeId) throw new Error('Missing store');
      socket.data.user = user;
      await socket.join(`store:${user.storeId}`);
      const timeout = setTimeout(
        () => socket.disconnect(true),
        Math.min(Math.max(0, payload.exp * 1000 - Date.now()), 2147483647),
      );
      socket.once('disconnect', () => clearTimeout(timeout));
    } catch {
      socket.disconnect(true);
    }
  }
  async publish(
    event: string,
    payload: { storeId: string; [key: string]: unknown },
  ) {
    await this.redis.publish(
      'crm:realtime',
      JSON.stringify({ storeId: payload.storeId, event, payload }),
    );
  }
  @OnEvent('chat.message.received', { async: true, suppressErrors: true })
  message(payload: { storeId: string }) {
    return this.publish('message:received', payload);
  }
  @OnEvent('chat.message.status', { async: true, suppressErrors: true })
  status(payload: { storeId: string }) {
    return this.publish('message:status', payload);
  }
  @OnEvent('chat.deal.created', { async: true, suppressErrors: true })
  deal(payload: { storeId: string }) {
    return this.publish('deal:created', payload);
  }
  @OnEvent('chat.ai.ready', { async: true, suppressErrors: true })
  analysis(payload: { storeId: string }) {
    return this.publish('autopilot:analysis-ready', payload);
  }
}
