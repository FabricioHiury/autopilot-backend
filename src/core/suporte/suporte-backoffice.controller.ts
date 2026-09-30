import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { SuporteService } from './suporte.service';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { Perfil } from 'src/auth/auth/roles-decorators/perfil/perfil.decorator';
import { USUARIO_PERFIL } from '../usuario/enum/perfil.enum';
import { PerfilGuard } from 'src/auth/auth/roles-decorators/perfil/perfil.guard';
import { PermissoesGuard } from 'src/auth/auth/roles-decorators/permissoes/permissoes.guard';
import { ApiTags } from '@nestjs/swagger';
import { ListarTicketDto } from './dto/listar-ticket-dto';
import { UsuarioId } from 'src/auth/auth/decorators/usuario-id-decorator';
import { ResponderTicketDto } from './dto/responder-ticket-dto';
import { AlterarTicketDto } from './dto/alterar-ticket-dto';

@ApiTags('Backoffice/Suporte')
@UseGuards(JwtAuthGuard, PerfilGuard, PermissoesGuard)
@Perfil(USUARIO_PERFIL.AUTOPILOT)
@Controller('backoffice/suporte')
export class SuporteBackofficeController {
  constructor(private readonly suporteService: SuporteService) {}

  @Get('/')
  async listarTickets(@Query() params: ListarTicketDto) {
    return await this.suporteService.listarTickets(params);
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

  @Get('/:idTicket')
  async pegarTicket(@Param('idTicket') idTicket: string) {
    return await this.suporteService.pegarTicket(idTicket);
  }

  @Post('/:idTicket/responder')
  async responderTicket(
    @UsuarioId() idUsuario: string,
    @Param('idTicket') idTicket: string,
    @Body() params: ResponderTicketDto,
  ) {
    return await this.suporteService.responderTicket(
      idTicket,
      idUsuario,
      params,
    );
  }

  @Put('/:idTicket/alterar-status')
  async alterarTicket(
    @UsuarioId() idUsuario: string,
    @Param('idTicket') idTicket: string,
    @Body() params: AlterarTicketDto,
  ) {
    return await this.suporteService.alterarStatusTicket(
      idTicket,
      idUsuario,
      params,
    );
  }
}
