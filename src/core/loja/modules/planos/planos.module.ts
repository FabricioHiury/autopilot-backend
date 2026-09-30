import { Module } from "@nestjs/common";
import { PlanosController } from "./planos.controller";
import { PlanosService } from "src/core/backoffice/modules/planos/planos.service";

@Module({
  controllers: [PlanosController],
  providers: [PlanosService],
})
export class PlanosModule {}