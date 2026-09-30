import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { BackofficeLojaService } from './backoffice-loja.service';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { Perfil } from 'src/auth/auth/roles-decorators/perfil/perfil.decorator';
import { PerfilGuard } from 'src/auth/auth/roles-decorators/perfil/perfil.guard';
import { PermissoesGuard } from 'src/auth/auth/roles-decorators/permissoes/permissoes.guard';
import { USUARIO_PERFIL } from 'src/core/usuario/enum/perfil.enum';
import { ListarLojasAdminDto } from './dto/listar-lojas-admin.dto';
import {
  ConfigurarIntegracaoWppDoc,
  ListarLojasAdminDoc,
} from './docs/backoffice-loja.swagger';
import { ConfigurarIntegracaoWppDto } from './dto/configurar-integracao-whatsapp.dto';

@UseGuards(JwtAuthGuard, PerfilGuard, PermissoesGuard)
@Perfil(USUARIO_PERFIL.AUTOPILOT)
@ApiTags('AutoPilot - lojas')
@Controller('backoffice/lojas')
export class BackofficeLojaController {
  constructor(private readonly backofficeLojaService: BackofficeLojaService) {}

  @ListarLojasAdminDoc()
  @Get('/')
  async listarLojas(@Query() params: ListarLojasAdminDto) {
    return await this.backofficeLojaService.listarLojas(params);
  }

  @ConfigurarIntegracaoWppDoc()
  @Post('/configurar-wpp')
  async configurarIntegracaoWpp(@Body() params: ConfigurarIntegracaoWppDto) {
    return await this.backofficeLojaService.configurarIntegracaoWpp(params);
  }
}
