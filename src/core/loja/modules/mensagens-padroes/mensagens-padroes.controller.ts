import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LojaId } from 'src/auth/auth/decorators/loja-id-decorator';
import { Permissoes } from 'src/auth/auth/roles-decorators/permissoes/permissoes.decorator';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { PermissoesGuard } from 'src/auth/auth/roles-decorators/permissoes/permissoes.guard';
import { PERMISSOES_LOJA } from 'src/core/usuario/enum/permissoes_funcionalidades.enum';
import { MensagensPadroesService } from './mensagens-padroes.service';
import { CriarMensagemPadraoDto } from './dto/criar-mensagem-padrao.dto';
import { EditarMensagemPadraoDto } from './dto/editar-mensagem-padrao.dto';
import { ListarMensagensPadroesDto } from './dto/listar-mensagens-padroes.dto';
import {
  criarMensagemPadraoSwagger,
  listarMensagensPadroesSwagger,
  editarMensagemPadraoSwagger,
  deletarMensagemPadraoSwagger,
  obterMensagemPadraoPorIdSwagger,
} from './docs/mensagens-padroes.swagger';

@ApiTags('Mensagens Padrões')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissoesGuard)
@Controller('mensagens-padroes')
export class MensagensPadroesController {
  constructor(
    private readonly mensagensPadroesService: MensagensPadroesService,
  ) {}

  @Post()
  @Permissoes([PERMISSOES_LOJA.LOJA_CRIAR_MENSAGEM_PADRAO])
  @ApiOperation(criarMensagemPadraoSwagger)
  async criar(
    @LojaId() idLoja: string,
    @Body() data: CriarMensagemPadraoDto,
  ) {
    return await this.mensagensPadroesService.criar(idLoja, data);
  }

  @Get()
  @Permissoes([PERMISSOES_LOJA.LOJA_VER_MENSAGENS_PADRAO])
  @ApiOperation(listarMensagensPadroesSwagger)
  async listar(
    @LojaId() idLoja: string,
    @Query() filtros: ListarMensagensPadroesDto,
  ) {
    return await this.mensagensPadroesService.listar(idLoja, filtros);
  }

  @Get(':id')
  @Permissoes([PERMISSOES_LOJA.LOJA_VER_MENSAGENS_PADRAO])
  @ApiOperation(obterMensagemPadraoPorIdSwagger)
  async obterPorId(@LojaId() idLoja: string, @Param('id') id: string) {
    return await this.mensagensPadroesService.obterPorId(idLoja, id);
  }

  @Patch(':id')
  @Permissoes([PERMISSOES_LOJA.LOJA_EDITAR_MENSAGEM_PADRAO])
  @ApiOperation(editarMensagemPadraoSwagger)
  async editar(
    @LojaId() idLoja: string,
    @Param('id') id: string,
    @Body() data: EditarMensagemPadraoDto,
  ) {
    return await this.mensagensPadroesService.editar(idLoja, id, data);
  }

  @Delete(':id')
  @Permissoes([PERMISSOES_LOJA.LOJA_DELETAR_MENSAGEM_PADRAO])
  @ApiOperation(deletarMensagemPadraoSwagger)
  async deletar(@LojaId() idLoja: string, @Param('id') id: string) {
    return await this.mensagensPadroesService.deletar(idLoja, id);
  }
}
