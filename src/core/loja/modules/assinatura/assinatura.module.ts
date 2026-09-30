import { Module } from "@nestjs/common";
import { AssinaturaController } from "./assinatura.controller";
import { AssinaturaService } from "src/core/backoffice/modules/assinatura/assinatura.service";

@Module({
  controllers: [AssinaturaController],
  providers: [AssinaturaService],
})
export class AssinaturaModule {}