import {
  Body,
  Controller,
  Get,
  Query,
  UseGuards,
  Post,
  Param,
  ParseIntPipe,
  Res,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { SuporteService } from './suporte.service';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { PermissoesGuard } from 'src/auth/auth/roles-decorators/permissoes/permissoes.guard';
import { UsuarioId } from 'src/auth/auth/decorators/usuario-id-decorator';
import { LojaId } from 'src/auth/auth/decorators/loja-id-decorator';
import { ListarTicketDto } from './dto/listar-ticket-dto';
import { CriarTicketDto } from './dto/criar-ticket-dto';
import { ResponderTicketDto } from './dto/responder-ticket-dto';
import { PerfilGuard } from 'src/auth/auth/roles-decorators/perfil/perfil.guard';
import { ObterAnexosDto } from './dto/obter-anexos.dto';
import { AnyFilesInterceptor } from '@nestjs/platform-express';

@ApiTags('Loja/Suporte')
@UseGuards(JwtAuthGuard, PerfilGuard, PermissoesGuard)
@Controller('suporte')
export class SuporteLojaController {
  constructor(private readonly suporteService: SuporteService) {}

  @Get('/')
  async listarTickets(
    @LojaId() idLoja: string,
    @Query() params: ListarTicketDto,
  ) {
    return await this.suporteService.listarTicketsLoja(idLoja, params);
  }

  @Get('/status')
  listarStatus() {
    return this.suporteService.listarStatusTickets();
  }

  @Get('/categorias')
  listarCategorias() {
    return this.suporteService.listarCategoriaTickets();
  }

  @Get('/prioridades')
  listarPrioridades() {
    return this.suporteService.listarPrioridadeTickets();
  }

  @Post('/')
  async criarTicket(
    @LojaId() idLoja: string,
    @UsuarioId() idUsuario: string,
    @Body() params: CriarTicketDto,
  ) {
    return await this.suporteService.criarTicket(idLoja, idUsuario, params);
  }

  @Get('/:idTicket')
  async pegarTicket(
    @LojaId() idLoja: string,
    @Param('idTicket') idTicket: string,
  ) {
    return await this.suporteService.pegarTicket(idTicket, idLoja);
  }

  @Post('/:idTicket/responder')
  async responderTicket(
    @UsuarioId() idUsuario: string,
    @LojaId() idLoja: string,
    @Param('idTicket') idTicket: string,
    @Body() params: ResponderTicketDto,
  ) {
    return await this.suporteService.responderTicket(
      idTicket,
      idUsuario,
      params,
      idLoja,
    );
  }

  @UseInterceptors(AnyFilesInterceptor())
  @Post('/:idTicket/anexos')
  async salvarAnexo(
    @LojaId() idLoja: string,
    @Param('idTicket') idTicket: string,
    @UploadedFiles() arquivos: Express.Multer.File[],
  ) {
    return await this.suporteService.salvarAnexo({
      lojaId: idLoja,
      ticketId: idTicket,
      arquivos,
    });
  }

  @UseInterceptors(AnyFilesInterceptor())
  @Post('/:idTicket/respostas/:idResposta/anexos')
  async salvarAnexoResposta(
    @LojaId() idLoja: string,
    @Param('idTicket') idTicket: string,
    @Param('idResposta') idResposta: string,
    @UploadedFiles() arquivos: Express.Multer.File[],
  ) {
    return await this.suporteService.salvarAnexo({
      lojaId: idLoja,
      ticketId: idTicket,
      arquivos,
      respostaId: idResposta,
    });
  }

  @Get('/:idTicket/anexos')
  async listarAnexos(
    @LojaId() idLoja: string,
    @Param('idTicket') idTicket: string,
    @Query() dados: ObterAnexosDto,
  ) {
    return await this.suporteService.listarAnexos({
      idTicket,
      idLoja,
      dados,
    });
  }

  @Get('/:idTicket/anexos/:idAnexo')
  async pegarAnexo(
    @LojaId() idLoja: string,
    @Param('idTicket') idTicket: string,
    @Param('idAnexo') idAnexo: string,
  ) {
    return await this.suporteService.pegarAnexo(idTicket, idLoja, idAnexo);
  }
}
