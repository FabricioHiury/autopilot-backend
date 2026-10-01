import { ConfigModule } from '@nestjs/config';
import { ChatAiModule } from './core/chat-ai/chat-ai.module';
import { CommunicationModule } from './core/communication/communication.module';
import { RealtimeModule } from './core/realtime/realtime.module';
import { Module } from '@nestjs/common';
import { PrismaModule } from './persistence/database/prisma/prisma.module';
import { AuthModule } from './auth/auth/auth.module';
import { MailModule } from './utils/mail/mail.module';
import { CoreModule } from './core/core.module';
import { FileModule } from './persistence/files/file/file.module';
import { NotificationsModule } from './core/notifications/notifications.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { RedisModule } from './core/redis/redis.module';
import { NovuModule } from './core/novu/novu.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    PrismaModule,
    NovuModule,
    AuthModule,
    MailModule,
    FileModule,
    CoreModule,
    NotificationsModule,
    RedisModule,
    RealtimeModule,
    CommunicationModule,
    ChatAiModule,
  ],
})
export class AppModule {}
