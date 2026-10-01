import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { io, Socket } from 'socket.io-client';
import { IngestionService } from './ingestion.service';
import { IncomingEventDto, MessageAckDto } from './incoming.dto';
@Injectable()
export class MicroserviceSocket implements OnModuleInit, OnModuleDestroy {
  private socket?: Socket;
  private readonly logger = new Logger(MicroserviceSocket.name);
  constructor(private readonly ingestion: IngestionService) {}
  onModuleInit() {
    const url = process.env.MICROSERVICE_WS_URL;
    if (!url) return;
    const token = process.env.MICROSERVICE_TOKEN;
    if (!token)
      throw new Error(
        'MICROSERVICE_TOKEN is required for the microservice socket',
      );
    this.socket = io(url, {
      auth: { token },
      extraHeaders: { 'x-micro-token': token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelayMax: 10000,
      timeout: 10000,
    });
    this.socket.on('connect_error', () =>
      this.logger.warn('Microservice socket unavailable; reconnecting'),
    );
    for (const [event, kind] of [
      ['message:incoming', 'message'],
      ['lead:incoming', 'lead'],
    ]) {
      this.socket.on(
        event,
        async (raw: unknown, ack?: (result: unknown) => void) => {
          try {
            const input = plainToInstance(IncomingEventDto, raw);
            await validateOrReject(input, {
              whitelist: true,
              forbidNonWhitelisted: true,
            });
            const result = await this.ingestion.accept(input, kind);
            if (typeof ack === 'function') ack(result);
          } catch {
            if (typeof ack === 'function') ack({ accepted: false });
          }
        },
      );
    }
    this.socket.on(
      'message:ack',
      async (raw: unknown, ack?: (result: unknown) => void) => {
        try {
          const input = plainToInstance(MessageAckDto, raw);
          await validateOrReject(input, {
            whitelist: true,
            forbidNonWhitelisted: true,
          });
          await this.ingestion.acknowledge(input);
          if (typeof ack === 'function') ack({ accepted: true });
        } catch {
          if (typeof ack === 'function') ack({ accepted: false });
        }
      },
    );
  }
  onModuleDestroy() {
    this.socket?.disconnect();
  }
}
