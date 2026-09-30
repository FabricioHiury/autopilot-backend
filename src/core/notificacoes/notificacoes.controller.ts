import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsuarioId } from 'src/auth/auth/decorators/usuario-id-decorator';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { NotificacoesService } from './notificacoes.service';
import { AlterarStatusNotificacaoDto, ListarNotificacaoDto } from './dto/notificacoes.dto';
import { AlterarStatusNotificacaoDoc, ListarNotificacoesDoc } from './docs/notificacoes.swagger';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Notificações')
@Controller('notificacoes')
@UseGuards(JwtAuthGuard)
export class NotificacoesController {
  constructor(private readonly notificacoesService: NotificacoesService) { }

  @ListarNotificacoesDoc()
  @Get('/listar')
  async listar(
    @UsuarioId() userId: string,
    @Query() query: ListarNotificacaoDto,
  ) {
    return await this.notificacoesService.listarNotificacoes(userId, query);
  }

  @Put('/todas-visualizadas')
  async marcarTodasVisualizadas(@UsuarioId() userId: string) {
    return await this.notificacoesService.marcarTodasComoLidas(userId);
  }

  @AlterarStatusNotificacaoDoc()
  @Put('/alterar-status/:idNotificacao')
  async alterar(
    @Body() alterarStatus: AlterarStatusNotificacaoDto,
    @Param('idNotificacao') idNotificacao: string,
  ) {
    return await this.notificacoesService.alterarNotificacao(
      alterarStatus,
      idNotificacao,
    );
  }
}
