import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { LojaId } from 'src/auth/auth/decorators/loja-id-decorator';
import { UsuarioId } from 'src/auth/auth/decorators/usuario-id-decorator';
import { CompartilhamentoService } from './compartilhamento.service';
import {
  criarCompartilhamentoDoc,
  listarCompartilhamentosDoc,
  removerCompartilhamentoDoc,
} from './docs/compartilhamento.swagger';

@ApiTags('Atendimento - compartilhamento')
@UseGuards(JwtAuthGuard)
@Controller('atendimento/:idAtendimento/compartilhamento')
export class CompartilhamentoController {
  constructor(
    private readonly compartilhamentoService: CompartilhamentoService,
  ) {}

  @criarCompartilhamentoDoc()
  @Post('/:idColaborador')
  async criar(
    @Param('idAtendimento') idAtendimento: string,
    @LojaId() idLoja: string,
    @UsuarioId() idUsuario: string,
    @Param('idColaborador') idColaborador: string,
  ) {
    return await this.compartilhamentoService.criar({
      idAtendimento,
      idLoja,
      idUsuario,
      idColaborador,
    });
  }

  @listarCompartilhamentosDoc()
  @Get()
  async listar(
    @Param('idAtendimento') idAtendimento: string,
    @LojaId() idLoja: string,
  ) {
    return await this.compartilhamentoService.listar({ idAtendimento, idLoja });
  }

  @removerCompartilhamentoDoc()
  @Delete('/:idColaborador')
  async remover(
    @Param('idAtendimento') idAtendimento: string,
    @LojaId() idLoja: string,
    @UsuarioId() idUsuario: string,
    @Param('idColaborador') idColaborador: string,
  ) {
    return await this.compartilhamentoService.remover({
      idAtendimento,
      idLoja,
      idUsuario,
      idColaborador,
    });
  }
}
