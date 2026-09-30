import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { ListarPlanosDto } from 'src/core/backoffice/modules/planos/dto/listar-planos.dto';
import { PlanosService } from 'src/core/backoffice/modules/planos/planos.service';

@Controller('loja/planos')
@UseGuards(JwtAuthGuard)
export class PlanosController {
  constructor(private readonly planosService: PlanosService) {}

  @Get()
  async listarPlanos(@Query() listarPlanosDto: ListarPlanosDto) {
    return await this.planosService.listarPlanos(listarPlanosDto);
  }
}
