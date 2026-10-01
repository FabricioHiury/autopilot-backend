import { Module } from '@nestjs/common';
import { AvatarExternalService } from './avatar-external.service';
import { AvatarExternalController } from './avatar-external.controller';

@Module({
  controllers: [AvatarExternalController],
  providers: [AvatarExternalService],
  exports: [AvatarExternalService],
})
export class AvatarExternalModule {}
