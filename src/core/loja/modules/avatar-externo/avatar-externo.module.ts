import { Module } from '@nestjs/common';
import { AvatarExternoService } from './avatar-externo.service';
import { AvatarExternoController } from './avatar-externo.controller';

@Module({
  controllers: [AvatarExternoController],
  providers: [AvatarExternoService],
  exports: [AvatarExternoService],
})
export class AvatarExternoModule {}
