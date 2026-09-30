import { Module } from '@nestjs/common';
import { LojaCargoController } from './cargo.controller';
import { LojaCargoService } from './cargo.service';

@Module({
  controllers: [LojaCargoController],
  providers: [LojaCargoService],
})
export class LojaCargoModule {}
