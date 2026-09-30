import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { TarefasService } from './tarefas.service';
import { CriarTarefaDto } from './dto/criar-tarefa.dto';
import { EditarTarefaDto } from './dto/editar-tarefa.dto';
import { Perfil } from 'src/auth/auth/roles-decorators/perfil/perfil.decorator';
import { USUARIO_PERFIL } from 'src/core/usuario/enum/perfil.enum';
import { LojaId } from 'src/auth/auth/decorators/loja-id-decorator';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { PerfilGuard } from 'src/auth/auth/roles-decorators/perfil/perfil.guard';
import {
  AlterarStatusTarefaDoc,
  CriarTarefaDoc,
  DeletarTarefaDoc,
  EditarTarefaDoc,
  ListarTarefasDoc,
  PegarTarefaDoc,
} from './docs/tarefas.swagger';
import { UsuarioId } from 'src/auth/auth/decorators/usuario-id-decorator';

@ApiTags('Tarefas')
@UseGuards(JwtAuthGuard, PerfilGuard)
@Controller('atendimento/:idAtendimento/tarefas')
export class TarefasController {
  constructor(private readonly tarefasService: TarefasService) {}

  @CriarTarefaDoc()
  @Perfil(USUARIO_PERFIL.USUARIO, USUARIO_PERFIL.LOJISTA)
  @Post()
  async criarTarefa(
    @LojaId() idLoja: string,
    @UsuarioId() idUsuario: string,
    @Param('idAtendimento') idAtendimento: string,
    @Body() criarTarefaDto: CriarTarefaDto,
  ) {
    return this.tarefasService.criarTarefa(
      idUsuario,
      criarTarefaDto,
      idAtendimento,
      idLoja,
    );
  }

  @ListarTarefasDoc()
  @Perfil(USUARIO_PERFIL.USUARIO, USUARIO_PERFIL.LOJISTA)
  @Get()
  async listarTarefas(
    @LojaId() idLoja: string,
    @Param('idAtendimento') idAtendimento: string,
  ) {
    return this.tarefasService.listarTarefas(idAtendimento, idLoja);
  }

  @PegarTarefaDoc()
  @Perfil(USUARIO_PERFIL.USUARIO, USUARIO_PERFIL.LOJISTA)
  @Get('/:idTarefa')
  async pegarTarefa(@Param('idTarefa') idTarefa: string) {
    return this.tarefasService.pegarTarefa(idTarefa);
  }

  @EditarTarefaDoc()
  @Perfil(USUARIO_PERFIL.USUARIO, USUARIO_PERFIL.LOJISTA)
  @Put('/:idTarefa')
  async editarTarefa(
    @Param('idTarefa') idTarefa: string,
    @Body() updateTarefaDto: EditarTarefaDto,
    @UsuarioId() idUsuario: string,
  ) {
    return this.tarefasService.editarTarefa(
      idUsuario,
      idTarefa,
      updateTarefaDto,
    );
  }

  @AlterarStatusTarefaDoc()
  @Perfil(USUARIO_PERFIL.USUARIO, USUARIO_PERFIL.LOJISTA)
  @Post('/:idTarefa')
  async alterarStatusTarefa(
    @Param('idTarefa') idTarefa: string,
    @UsuarioId() idUsuario: string,
  ) {
    return this.tarefasService.alterarStatusTarefa(idUsuario, idTarefa);
  }

  @DeletarTarefaDoc()
  @Perfil(USUARIO_PERFIL.USUARIO, USUARIO_PERFIL.LOJISTA)
  @Delete('/:idTarefa')
  async deletarTarefa(
    @Param('idTarefa') idTarefa: string,
    @UsuarioId() idUsuario: string,
  ) {
    return this.tarefasService.deletarTarefa(idTarefa, idUsuario);
  }
}
