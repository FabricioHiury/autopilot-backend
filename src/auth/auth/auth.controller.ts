import { Controller, Post, Body, Param, HttpCode, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResponseLoginDto } from './dto/response-login.dto';
import { RedefinirSenhaDto } from './dto/redefinir-senha.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { USUARIO_PERFIL } from 'src/core/usuario/enum/perfil.enum';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }


  @ApiOperation({ summary: 'Login do usuario' })
  @ApiResponse({ status: 200, type: ResponseLoginDto })
  @HttpCode(200)
  @Post('login')
  async login(
    @Body() signAuthDto: LoginDto
  ) {
    return this.authService.login(signAuthDto);
  }

  @ApiOperation({ summary: 'Solicitar redefinição de senha' })
  @Post('esqueci-senha/:email')
  async esqueciSenha(
    @Param('email') email: string
  ) {
    const result = await this.authService.enviarEmailDeRecuperacao(email);
    return result;
  }

  @ApiOperation({ summary: 'Redefinir senha com base em token de redefinição' })
  @Post('redefinir-senha')
  async redefinirSenha(
    @Body() redefinirSenhaDto: RedefinirSenhaDto
  ) {
    await this.authService.redefinirSenha(redefinirSenhaDto.token, redefinirSenhaDto.senha);
    return { message: 'Senha redefinida com sucesso' };
  }

  @ApiOperation({ summary: 'Validar token de autenticação' })
  @UseGuards(JwtAuthGuard)
  @Post('validate')
  async validate(@Request() req) {

    const user = req.user;
    if (user.perfil === USUARIO_PERFIL.AUTOPILOT) {
      return {
        authenticated: true,
        nome: user.nome,
        redirect: '/backoffice/app/dashboard'
      };
    } else if (user.perfil === USUARIO_PERFIL.LOJISTA || user.perfil === USUARIO_PERFIL.USUARIO) {
      return {
        authenticated: true,
        nome: user.nome,
        redirect: '/app/dashboard'
      };
    }

    return {
      authenticated: false,
      redirect: '/login'
    };
  }

}
