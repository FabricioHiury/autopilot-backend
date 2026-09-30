import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { SuspensaoService } from './suspensao.service';
import { CriarSuspensaoDto } from './dto/criar-suspensao.dto';
import { AtualizarSuspensaoDto } from './dto/atualizar-suspensao.dto';
import { FiltroSuspensaoDto } from './dto/filtro-suspensao.dto';
import { PermissoesGuard } from 'src/auth/auth/roles-decorators/permissoes/permissoes.guard';
import { Permissoes } from 'src/auth/auth/roles-decorators/permissoes/permissoes.decorator';
import {
  atualizarSuspensaoDoc,
  criarSuspensaoDoc,
  listarSuspensoesDoc,
  obterSuspensaoPorIdDoc,
  removerSuspensaoDoc,
  verificarUsuarioSuspensoDoc,
} from './docs/suspensao.swagger';
import { PERMISSOES_LOJA } from 'src/core/usuario/enum/permissoes_funcionalidades.enum';

@ApiTags('Suspensão de Atendimento')
@Controller('suspensao')
@UseGuards(JwtAuthGuard, PermissoesGuard)
@ApiBearerAuth()
export class SuspensaoController {
  constructor(private readonly suspensaoService: SuspensaoService) {}

  @Post()
  @criarSuspensaoDoc()
  @Permissoes([PERMISSOES_LOJA.LOJA_GERENCIAR_SUSPENSOES])
  async criar(@Body() dados: CriarSuspensaoDto) {
    return this.suspensaoService.criar(dados);
  }

  @Put(':id')
  @atualizarSuspensaoDoc()
  @Permissoes([PERMISSOES_LOJA.LOJA_GERENCIAR_SUSPENSOES])
  async atualizar(@Param('id') id: string, @Body() dados: AtualizarSuspensaoDto) {
    return this.suspensaoService.atualizar(id, dados);
  }

  @Delete(':id')
  @removerSuspensaoDoc()
  @Permissoes([PERMISSOES_LOJA.LOJA_GERENCIAR_SUSPENSOES])
  async remover(@Param('id') id: string) {
    return this.suspensaoService.remover(id);
  }

  @Get()
  @listarSuspensoesDoc()
  @Permissoes([PERMISSOES_LOJA.LOJA_GERENCIAR_SUSPENSOES])
  async listar(@Query() filtros: FiltroSuspensaoDto) {
    return this.suspensaoService.listar(filtros);
  }

  @Get('usuario/:id/suspenso')
  @verificarUsuarioSuspensoDoc()
  @Permissoes([PERMISSOES_LOJA.LOJA_GERENCIAR_SUSPENSOES])
  async verificarUsuarioSuspenso(@Param('id') id: string) {
    const suspenso = await this.suspensaoService.verificarUsuarioSuspenso(id);
    return { suspenso };
  }

  @Get(':id')
  @obterSuspensaoPorIdDoc()
  @Permissoes([PERMISSOES_LOJA.LOJA_GERENCIAR_SUSPENSOES])
  async obterPorId(@Param('id') id: string) {
    return this.suspensaoService.obterPorId(id);
  }
}
