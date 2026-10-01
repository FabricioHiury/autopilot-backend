import { Module } from '@nestjs/common';
import { ShareController } from './share.controller';
import { ShareService } from './share.service';
import { EventModule } from '../events/event.module';

@Module({
  controllers: [ShareController],
  providers: [ShareService],
  imports: [EventModule],
})
export class ShareModule {}
