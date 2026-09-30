import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { VisitasService } from './visitas.service';
import { CriarVisitaDto } from './dto/criar-visita.dto';
import { Perfil } from 'src/auth/auth/roles-decorators/perfil/perfil.decorator';
import { USUARIO_PERFIL } from 'src/core/usuario/enum/perfil.enum';
import { LojaId } from 'src/auth/auth/decorators/loja-id-decorator';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { PerfilGuard } from 'src/auth/auth/roles-decorators/perfil/perfil.guard';
import { UsuarioId } from 'src/auth/auth/decorators/usuario-id-decorator';

@ApiTags('Visitas')
@UseGuards(JwtAuthGuard, PerfilGuard)
@Controller('atendimento/:idAtendimento/visitas')
export class VisitasController {
  constructor(private readonly visitasService: VisitasService) {}

  @Perfil(USUARIO_PERFIL.USUARIO, USUARIO_PERFIL.LOJISTA)
  @Post()
  async criarVisita(
    @LojaId() idLoja: string,
    @UsuarioId() idUsuario: string,
    @Param('idAtendimento') idAtendimento: string,
    @Body() criarTarefaDto: CriarVisitaDto,
  ) {
    return this.visitasService.criarVisita(
      idUsuario,
      criarTarefaDto,
      idAtendimento,
      idLoja,
    );
  }

  @Perfil(USUARIO_PERFIL.USUARIO, USUARIO_PERFIL.LOJISTA)
  @Get()
  async listarVisita(
    @LojaId() idLoja: string,
    @Param('idAtendimento') idAtendimento: string,
  ) {
    return this.visitasService.listarVisitas(idAtendimento, idLoja);
  }

  @Perfil(USUARIO_PERFIL.USUARIO, USUARIO_PERFIL.LOJISTA)
  @Get('/:idVisita')
  async pegarVisita(@Param('idVisita') idVisita: string) {
    return this.visitasService.pegarVisita(idVisita);
  }

  @Perfil(USUARIO_PERFIL.USUARIO, USUARIO_PERFIL.LOJISTA)
  @Delete('/:idVisita')
  async deletarVisita(
    @UsuarioId() idUsuario: string,
    @LojaId() idLoja: string,
    @Param('idAtendimento') idAtendimento: string,
    @Param('idVisita') idVisita: string
  ) {
    return this.visitasService.excluirVisita({
      idLoja,
      idUsuario,
      idVisita,
      idAtendimento,
    });
  }

  @Perfil(USUARIO_PERFIL.USUARIO, USUARIO_PERFIL.LOJISTA)
  @Post('/:idVisita')
  async alterarStatusVisita(
    @Param('idVisita') idVisita: string,
    @UsuarioId() idUsuario: string,
  ) {
    return this.visitasService.concluirVisita(idUsuario, idVisita);
  }

}
