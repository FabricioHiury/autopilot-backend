import { Module } from '@nestjs/common';
import { PrismaModule } from './persistence/database/prisma/prisma.module';
import { AuthModule } from './auth/auth/auth.module';
import { MailModule } from './utils/mail/mail.module';
import { CoreModule } from './core/core.module';
import { FileModule } from './persistence/files/file/file.module';
import { NotificacoesModule } from './core/notificacoes/notificacoes.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { RedisModule } from './core/redis/redis.module';
import { WebhookModule } from './webhook/webhook.module';
import { NovuModule } from './core/novu/novu.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    PrismaModule,
    NovuModule,
    AuthModule,
    MailModule,
    FileModule,
    CoreModule,
    NotificacoesModule,
    RedisModule,
    WebhookModule,
  ],
})
export class AppModule {}

