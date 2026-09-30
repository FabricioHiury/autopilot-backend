import {
  Body,
  Controller,
  Query,
  Post,
  Get,
  UseGuards,
  Put,
  Param,
  Delete,
  UploadedFiles,
  UseInterceptors,
  Patch,
} from '@nestjs/common';
import { AtendimentoService } from './atendimento.service';
import { CriarAtendimentoDto } from './dto/criar-atendimento.dto';
import { FiltroAtendimentoDto } from './dto/filtros-atendimento.dto';
import { LojaId } from 'src/auth/auth/decorators/loja-id-decorator';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CriarAtendimentoDoc,
  criarComentariosDoc,
  DeletarAnexoAtendimentoDoc,
  EditarAtendimentoDoc,
  listarAtendimentoDocs,
  listarComentariosDoc,
  ObterAnexosAtendimentoDoc,
  ObterAtendimentoPorIdDoc,
  removerResponsaveisDoc,
  SalvarAnexoAtendimentoDoc,
  alterarClienteAtendimentoDoc,
} from './docs/atendimentos.swagger';
import { UsuarioId } from 'src/auth/auth/decorators/usuario-id-decorator';
import { PermissoesGuard } from 'src/auth/auth/roles-decorators/permissoes/permissoes.guard';
import { Permissoes } from 'src/auth/auth/roles-decorators/permissoes/permissoes.decorator';
import { PERMISSOES_LOJA } from 'src/core/usuario/enum/permissoes_funcionalidades.enum';
import { EditarAtendimentoDto } from './dto/editar-atendimento.dto';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { CriarComentarioDto } from './dto/criar-comentario.dto';
import { ListarComentariosDto } from './dto/listar-comentario.dto';
import { RemoverResponsaveisDto } from './dto/remover-responsaveis.dto';
import { ObterAnexosAtendimentoDto } from './dto/obter-anexos-atendimento';
import { ListarLogsDto } from './dto/listar-logs.dto';
import { LogAtividadesService } from './modules/log-atividades/log-atividades.service';
import { HistoricoClienteDto } from './dto/historico-cliente.dto';

@ApiTags('Atendimento')
@UseGuards(JwtAuthGuard, PermissoesGuard)
@Controller('atendimento')
export class AtendimentoController {
  constructor(
    private readonly atendimentoService: AtendimentoService,
    private readonly logAtividadesService: LogAtividadesService,
  ) {}

  @CriarAtendimentoDoc()
  @Post()
  async criarAtendimento(
    @Body() data: CriarAtendimentoDto,
    @LojaId() idLoja: string,
    @UsuarioId() idUsuario: string,
  ) {
    return await this.atendimentoService.criar(data, idLoja, idUsuario);
  }

  @listarAtendimentoDocs()
  @Get('listar-atendimentos')
  @Permissoes([PERMISSOES_LOJA.LOJA_VER_ATENDIMENTOS])
  async obterTodos(
    @Query() filtros: FiltroAtendimentoDto,
    @LojaId() idLoja: string,
    @UsuarioId() idUsuario: string,
  ) {
    return await this.atendimentoService.listarAtendimentos(
      idLoja,
      filtros,
      idUsuario,
    );
  }

  @Get('listar-chats')
  @Permissoes([PERMISSOES_LOJA.LOJA_VER_CHAT])
  async listarChats(
    @Query() filtros: FiltroAtendimentoDto,
    @LojaId() idLoja: string,
    @UsuarioId() idUsuario: string,
  ) {
    return await this.atendimentoService.listarChats(
      idLoja,
      filtros,
      idUsuario,
    );
  }

  @Get('historico-cliente')
  @ApiOperation({
    summary: 'Obter histórico completo de atendimentos de um cliente',
    description:
      'Retorna todos os atendimentos anteriores associados a um cliente (normal ou temporário) com paginação e filtros',
  })
  @Permissoes([PERMISSOES_LOJA.LOJA_VER_ATENDIMENTOS])
  @ApiResponse({
    status: 200,
    description: 'Histórico de atendimentos obtido com sucesso',
    schema: {
      type: 'object',
      properties: {
        atendimentos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              titulo: { type: 'string' },
              descricao: { type: 'string' },
              status: { type: 'string' },
              modoAtendimento: { type: 'string' },
              origem: { type: 'string' },
              criadoEm: { type: 'string', format: 'date-time' },
              atualizadoEm: { type: 'string', format: 'date-time' },
              cliente: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  nome: { type: 'string' },
                  email: { type: 'string' },
                  telefone: { type: 'string' },
                  whatsapp: { type: 'string' },
                  urlAvatar: { type: 'string', nullable: true },
                  tipo: {
                    type: 'string',
                    enum: ['cliente', 'clienteTemporario'],
                  },
                },
              },
              responsaveis: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    nome: { type: 'string' },
                    urlAvatar: { type: 'string' },
                  },
                },
              },
              tags: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    nome: { type: 'string' },
                    cor: { type: 'string' },
                  },
                },
              },
              contadores: {
                type: 'object',
                properties: {
                  comentarios: { type: 'number' },
                  anexos: { type: 'number' },
                },
              },
            },
          },
        },
        paginacao: {
          type: 'object',
          properties: {
            paginaAtual: { type: 'number' },
            itensPorPagina: { type: 'number' },
            totalItens: { type: 'number' },
            totalPaginas: { type: 'number' },
            temProximaPagina: { type: 'boolean' },
            temPaginaAnterior: { type: 'boolean' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Parâmetros inválidos - é necessário informar o ID do cliente ou cliente temporário',
  })
  async obterHistoricoCliente(
    @Query() params: HistoricoClienteDto,
    @LojaId() idLoja: string,
  ) {
    return await this.atendimentoService.obterHistoricoCliente(idLoja, params);
  }

  @ObterAtendimentoPorIdDoc()
  @Get('/:idAtendimento')
  @Permissoes([PERMISSOES_LOJA.LOJA_VER_ATENDIMENTOS])
  async buscarAtendimentoPorId(
    @Param('idAtendimento') idAtendimento: string,
    @LojaId() idLoja: string,
  ) {
    return await this.atendimentoService.obterAtendimentoPorId(
      idAtendimento,
      idLoja,
    );
  }

  @Get('/:idAtendimento/anexos-chat')
  @Permissoes([PERMISSOES_LOJA.LOJA_VER_CHAT])
  async buscarAnexosAtendimentoPorId(
    @Param('idAtendimento') idAtendimento: string,
    @LojaId() idLoja: string,
  ) {
    return await this.atendimentoService.listarArquivosDeChat(
      idAtendimento,
      idLoja,
    );
  }

  @EditarAtendimentoDoc()
  @Put('/:idAtendimento/editar')
  @Permissoes([PERMISSOES_LOJA.LOJA_EDITAR_EXCLUIR_ATENDIMENTO])
  async editarAtendimento(
    @Param('idAtendimento') idAtendimento: string,
    @LojaId() idLoja: string,
    @Body() alterarAtendimentoDto: EditarAtendimentoDto,
    @UsuarioId() idUsuario: string,
  ) {
    return await this.atendimentoService.editarAtendimento(
      idAtendimento,
      idLoja,
      alterarAtendimentoDto,
      idUsuario,
    );
  }

  @alterarClienteAtendimentoDoc()
  @Put('/:idAtendimento/alterar-cliente/:idCliente')
  @Permissoes([PERMISSOES_LOJA.LOJA_EDITAR_EXCLUIR_ATENDIMENTO])
  async alterarCliente(
    @Param('idAtendimento') idAtendimento: string,
    @Param('idCliente') idCliente: string,
    @LojaId() idLoja: string,
    @UsuarioId() idUsuario: string,
  ) {
    return await this.atendimentoService.alterarCliente({
      idAtendimento,
      idUsuario,
      idLoja,
      idCliente,
    });
  }

  @Patch('/:idAtendimento/alterar-titulo')
  @Permissoes([PERMISSOES_LOJA.LOJA_EDITAR_EXCLUIR_ATENDIMENTO])
  async alterarTitulo(
    @Param('idAtendimento') idAtendimento: string,
    @LojaId() idLoja: string,
    @UsuarioId() idUsuario: string,
    @Body() body: { titulo: string },
  ) {
    return await this.atendimentoService.alterarTitulo(
      idAtendimento,
      idUsuario,
      idLoja,
      body.titulo,
    );
  }

  @Patch('/:idAtendimento/alterar-descricao')
  @Permissoes([PERMISSOES_LOJA.LOJA_EDITAR_EXCLUIR_ATENDIMENTO])
  async alterarDescricao(
    @Param('idAtendimento') idAtendimento: string,
    @LojaId() idLoja: string,
    @UsuarioId() idUsuario: string,
    @Body() body: { descricao: string },
  ) {
    return await this.atendimentoService.alterarDescricao(
      idAtendimento,
      idUsuario,
      idLoja,
      body.descricao,
    );
  }

  @ObterAnexosAtendimentoDoc()
  @Get('/:idAtendimento/anexos')
  @Permissoes([PERMISSOES_LOJA.LOJA_VER_ATENDIMENTOS])
  async obterAnexosAtendimento(
    @LojaId() idLoja: string,
    @Param('idAtendimento') idAtendimento: string,
    @Query() params: ObterAnexosAtendimentoDto,
  ) {
    return await this.atendimentoService.obterAnexosAtendimento(
      idAtendimento,
      idLoja,
      params,
    );
  }

  @SalvarAnexoAtendimentoDoc()
  @UseInterceptors(AnyFilesInterceptor())
  @Post('/:idAtendimento/anexo')
  @Permissoes([PERMISSOES_LOJA.LOJA_EDITAR_EXCLUIR_ATENDIMENTO])
  async salvarAnexo(
    @LojaId() idLoja: string,
    @UsuarioId() idUsuario: string,
    @Param('idAtendimento') idAtendimento: string,
    @UploadedFiles() arquivos: Express.Multer.File[],
  ) {
    return await this.atendimentoService.salvarAnexo(
      idLoja,
      idUsuario,
      idAtendimento,
      arquivos,
    );
  }

  @DeletarAnexoAtendimentoDoc()
  @Delete('/:idAtendimento/anexo/:idAnexo')
  @Permissoes([PERMISSOES_LOJA.LOJA_EDITAR_EXCLUIR_ATENDIMENTO])
  async deletarAvatar(
    @LojaId() idLoja: string,
    @UsuarioId() idUsuario: string,
    @Param('idAtendimento') idAtendimento: string,
    @Param('idAnexo') idAnexo: string,
  ) {
    await this.atendimentoService.deletarAnexo(
      idAtendimento,
      idUsuario,
      idLoja,
      idAnexo,
    );

    return {
      success: true,
      message: 'Anexo deletado com sucesso',
    };
  }

  @criarComentariosDoc()
  @Post('/:idAtendimento/comentario')
  @Permissoes([PERMISSOES_LOJA.LOJA_RESPONDER_CHAT])
  async criarComentario(
    @Param('idAtendimento') idAtendimento: string,
    @UsuarioId() idUsuario: string,
    @Body() comentario: CriarComentarioDto,
  ) {
    return await this.atendimentoService.criarComentario(
      idAtendimento,
      idUsuario,
      comentario,
    );
  }

  @listarComentariosDoc()
  @Get('/:idAtendimento/comentarios')
  @Permissoes([PERMISSOES_LOJA.LOJA_VER_ATENDIMENTOS])
  async obterComentarios(
    @Param('idAtendimento') idAtendimento: string,
    @LojaId() idLoja: string,
    @Query() params: ListarComentariosDto,
  ) {
    return await this.atendimentoService.listarComentarios(
      idAtendimento,
      idLoja,
      params,
    );
  }

  @removerResponsaveisDoc()
  @Delete('/:idAtendimento/responsaveis')
  @Permissoes([PERMISSOES_LOJA.LOJA_VINCULAR_ATENDIMENTO_USUARIO])
  async removerResponsaveis(
    @Param('idAtendimento') idAtendimento: string,
    @LojaId() idLoja: string,
    @UsuarioId() idUsuario: string,
    @Body() removerResponsaveis: RemoverResponsaveisDto,
  ) {
    return await this.atendimentoService.removerResponsaveis(
      idAtendimento,
      idLoja,
      idUsuario,
      removerResponsaveis.idResponsaveis,
    );
  }

  @ApiOperation({
    summary: 'Excluir atendimento preservando chats',
    description:
      'Exclui um atendimento e desvincula todos os chats relacionados (os chats são preservados e continuam acessíveis).',
  })
  @ApiResponse({
    status: 200,
    description: 'Atendimento excluído com sucesso e chats desvinculados',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        chatsDesvinculados: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Atendimento não encontrado' })
  @Delete('/:idAtendimento')
  @Permissoes([PERMISSOES_LOJA.LOJA_EDITAR_EXCLUIR_ATENDIMENTO])
  async excluirAtendimento(
    @Param('idAtendimento') idAtendimento: string,
    @LojaId() idLoja: string,
    @UsuarioId() idUsuario: string,
  ) {
    return await this.atendimentoService.excluirAtendimentoDesvinculandoChats(
      idAtendimento,
      idLoja,
      idUsuario,
    );
  }

  @Patch('/:idAtendimento/arquivar')
  @Permissoes([PERMISSOES_LOJA.LOJA_EDITAR_EXCLUIR_ATENDIMENTO])
  async arquivarAtendimento(
    @Param('idAtendimento') idAtendimento: string,
    @LojaId() idLoja: string,
    @UsuarioId() idUsuario: string,
  ) {
    return await this.atendimentoService.archiveAttendance(
      idAtendimento,
      idLoja,
      idUsuario,
    );
  }

  @Patch('/:idAtendimento/desarquivar')
  @Permissoes([PERMISSOES_LOJA.LOJA_EDITAR_EXCLUIR_ATENDIMENTO])
  async desarquivarAtendimento(
    @Param('idAtendimento') idAtendimento: string,
    @LojaId() idLoja: string,
    @UsuarioId() idUsuario: string,
  ) {
    return await this.atendimentoService.unarchiveAttendance(
      idAtendimento,
      idLoja,
      idUsuario,
    );
  }

  @Get('/:idAtendimento/logs')
  @ApiOperation({
    summary: 'Listar logs de atividades de um atendimento',
    description: 'Retorna os logs de atividades de um atendimento específico com paginação',
  })
  @Permissoes([PERMISSOES_LOJA.LOJA_VER_ATENDIMENTOS])
  @ApiResponse({
    status: 200,
    description: 'Logs listados com sucesso',
    schema: {
      type: 'object',
      properties: {
        logs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              tipoEvento: { type: 'string' },
              descricao: { type: 'string' },
              criadoEm: { type: 'string', format: 'date-time' },
              usuario: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  nome: { type: 'string' },
                },
              },
            },
          },
        },
        paginacao: {
          type: 'object',
          properties: {
            paginaAtual: { type: 'number' },
            itensPorPagina: { type: 'number' },
            totalItens: { type: 'number' },
            totalPaginas: { type: 'number' },
            temProximaPagina: { type: 'boolean' },
            temPaginaAnterior: { type: 'boolean' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Atendimento não encontrado',
  })
  async listarLogsAtendimento(
    @Param('idAtendimento') idAtendimento: string,
    @Query() params: ListarLogsDto,
  ) {
    return await this.logAtividadesService.listarLogsAtendimento(
      idAtendimento,
      params.pagina,
      params.quantidade,
    );
  }
}
