import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { Perfil } from 'src/auth/auth/roles-decorators/perfil/perfil.decorator';
import { PerfilGuard } from 'src/auth/auth/roles-decorators/perfil/perfil.guard';
import { Permissoes } from 'src/auth/auth/roles-decorators/permissoes/permissoes.decorator';
import { PermissoesGuard } from 'src/auth/auth/roles-decorators/permissoes/permissoes.guard';
import { USUARIO_PERFIL } from 'src/core/usuario/enum/perfil.enum';
import { PERMISSOES_AUTOPILOT } from 'src/core/usuario/enum/permissoes_funcionalidades.enum';
import { DashboardService } from './dashboard.service';
import {
  ObterAssinaturasAnoDoc,
  ObterEstatisticasCadastrosDoc,
  ObterReceitaETaxaChurnDoc,
  ObterUltimasAssinaturasDoc,
  ObterVidaUtilClientesDoc,
} from './docs/dashboard.swagger';
import { FiltroDataDto } from './dto/filtro-data.dto';
import { FiltroPaginaPesquisaDto } from './dto/filtro-pagina-pesquisa';
import { FiltroAnoDto } from './dto/filtro-ano.dto';

@ApiTags('AutoPilot - dashboard')
@Controller('backoffice/dashboard')
@UseGuards(JwtAuthGuard, PermissoesGuard, PerfilGuard)
@Perfil(USUARIO_PERFIL.AUTOPILOT)
@Permissoes([PERMISSOES_AUTOPILOT.AUTOPILOT_VER_DASHBOARD])
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @ObterEstatisticasCadastrosDoc()
  @Get('/estatisticas-cadastro')
  async obterEstatisticasCadastros(@Query() params: FiltroDataDto) {
    return await this.dashboardService.obterEstatisticasCadastros(params);
  }

  @ObterReceitaETaxaChurnDoc()
  @Get('/receita-taxachurn')
  async obterReceitaETaxaChurn(@Query() params: FiltroDataDto) {
    return await this.dashboardService.obterReceitaETaxaChurn(params);
  }

  @ObterVidaUtilClientesDoc()
  @Get('/vida-util-clientes')
  async obterVidaUtilCliente(@Query() params: FiltroPaginaPesquisaDto) {
    return await this.dashboardService.obterVidaUtilClientes(params);
  }

  @ObterUltimasAssinaturasDoc()
  @Get('/ultimas-assinaturas')
  async obterUltimasAssinaturas() {
    return await this.dashboardService.obterUltimasAssinaturas();
  }

  @ObterAssinaturasAnoDoc()
  @Get('/assinaturas-ano')
  async obterAssinaturasAno(@Query() params: FiltroAnoDto) {
    return await this.dashboardService.obterAssinaturasAno(params);
  }
}
