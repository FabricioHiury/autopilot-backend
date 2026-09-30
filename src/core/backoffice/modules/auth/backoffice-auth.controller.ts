import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { USUARIO_PERFIL } from 'src/core/usuario/enum/perfil.enum';
import { UsuarioId } from 'src/auth/auth/decorators/usuario-id-decorator';
import { Perfil } from 'src/auth/auth/roles-decorators/perfil/perfil.decorator';
import { PerfilGuard } from 'src/auth/auth/roles-decorators/perfil/perfil.guard';
import { AuthService } from 'src/auth/auth/auth.service';
import { ResponseAcessoBackofficeDto } from './dto/response-acesso-backoffice.dto';

@ApiTags('Backoffice - Auth')
@Controller('backoffice/auth')
@UseGuards(JwtAuthGuard, PerfilGuard)
export class BackofficeAuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Obter permissões do usuário do backoffice' })
  @ApiResponse({ status: 200, type: ResponseAcessoBackofficeDto })
  @Perfil(USUARIO_PERFIL.AUTOPILOT)
  @Get('acesso')
  async acessoBackoffice(@UsuarioId() idUsuario: string) {
    return this.authService.pegarAcessoBackoffice(idUsuario);
  }
}
