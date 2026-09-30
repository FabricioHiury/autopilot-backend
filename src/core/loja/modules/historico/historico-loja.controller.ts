import { Controller, Get, UseGuards } from '@nestjs/common';
import { HistoricoLojaService } from './historico-loja.service';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { LojaId } from 'src/auth/auth/decorators/loja-id-decorator';
import { ListarHistoricoLojaDto } from './dto/listar-historico-loja.dto';
import { ApiTags } from '@nestjs/swagger';
import { ListarHistoricoLojaDoc } from './docs/historico-loja.swagger';

@ApiTags('Histórico loja')
@UseGuards(JwtAuthGuard)
@Controller('historico-loja')
export class HistoricoLojaController {
  constructor(private readonly historicoLojaService: HistoricoLojaService) {}

  @ListarHistoricoLojaDoc()
  @Get('/')
  listarHistoricoLoja(
    @LojaId() idLoja: string,
    params: ListarHistoricoLojaDto,
  ) {
    return this.historicoLojaService.listarHistoricoLoja(idLoja, params);
  }
}
