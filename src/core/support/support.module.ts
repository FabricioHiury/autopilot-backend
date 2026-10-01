import { Module } from '@nestjs/common';
import { SupportService } from './support.service';
import { SupportBackofficeController } from './support-backoffice.controller';
import { SupportStoreController } from './support-store.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [ScheduleModule.forRoot(), NotificationsModule],
  controllers: [SupportBackofficeController, SupportStoreController],
  providers: [SupportService],
})
export class SupportModule {}
