import { Module } from '@nestjs/common';
import { AssinaturaService } from './assinatura.service';
import { AssinaturaController } from './assinatura.controller';

@Module({
  providers: [AssinaturaService],
  controllers: [AssinaturaController],
})
export class AssinaturaModule {}
