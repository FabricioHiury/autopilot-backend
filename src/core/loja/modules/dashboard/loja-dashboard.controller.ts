import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { LojaDashboardService } from './loja-dashboard.service';
import { LojaId } from 'src/auth/auth/decorators/loja-id-decorator';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { MODO_ATENDIMENTO } from 'src/utils/enum/atendimento.enum';
import { PegarOrigemAtendimentosDto } from './dto/pegar-origem-atendimentos.dto';
import {
  PegarRelatorioSemanalDoc,
  PegarUltimosAtendimentosDoc,
  PegarOrigemAtendimentosDoc,
} from './docs/loja-dashboard.swagger';
import { ApiTags } from '@nestjs/swagger';
import { PermissoesGuard } from 'src/auth/auth/roles-decorators/permissoes/permissoes.guard';
import { UsuarioId } from 'src/auth/auth/decorators/usuario-id-decorator';
import { Permissoes } from 'src/auth/auth/roles-decorators/permissoes/permissoes.decorator';
import { PERMISSOES_LOJA } from 'src/core/usuario/enum/permissoes_funcionalidades.enum';

@ApiTags('Loja - dashboard')
@UseGuards(JwtAuthGuard, PermissoesGuard)
@Permissoes([PERMISSOES_LOJA.LOJA_VER_DASHBOARD])
@Controller('loja/dashboard')
export class LojaDashboardController {
  constructor(private readonly lojaDashboardService: LojaDashboardService) {}

  @PegarRelatorioSemanalDoc()
  @Get('/relatorio-semanal')
  async pegarRelatorioSemanal(@LojaId() idLoja: string, @UsuarioId() idUsuario?: string) {
    return await this.lojaDashboardService.pegarRelatorioSemanal(idLoja, idUsuario);
  }

  @PegarUltimosAtendimentosDoc()
  @Get('/ultimos-atendimentos')
  async pegarUltimosAtendimentos(
    @LojaId() idLoja: string,
    @Query('modo') modo?: MODO_ATENDIMENTO | undefined,
  ) {
    return await this.lojaDashboardService.pegarUltimosAtendimentos(
      idLoja,
      modo,
    );
  }

  @PegarOrigemAtendimentosDoc()
  @Get('/origem-atendimentos')
  async pegarOrigemAtendimentos(
    @LojaId() idLoja: string,
    @Query() query: PegarOrigemAtendimentosDto,
  ) {
    const { agrupamento, dataInicio, dataFim } = query;

    return await this.lojaDashboardService.pegarOrigemAtendimentos(
      idLoja,
      agrupamento,
      dataInicio,
      dataFim,
    );
  }

  @Get('/overview')
  async obterOverview(
    @LojaId() idLoja: string,
  ) {
    return await this.lojaDashboardService.obterOverview(idLoja);
  }
}
