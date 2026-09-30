import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { UsuarioId } from 'src/auth/auth/decorators/usuario-id-decorator';
import { EditarUsuarioDto } from './dto/in/editar-usuario.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ListarUsuariosDto } from './dto/in/listar-usuario.dto';
import { USUARIO_PERFIL } from './enum/perfil.enum';

@ApiTags('Usuario')
@UseGuards(JwtAuthGuard)
@Controller('usuario')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) { }

  @ApiOperation({ summary: 'Listar usuários' })
  @Get('/listar')
  async listarUsuarios(
    @Query() query: ListarUsuariosDto,
  ) {
    return this.usuarioService.listarUsuarios(USUARIO_PERFIL.LOJISTA, query);
  }


  @ApiOperation({ summary: 'Edita um usuário' })
  @ApiBody({ type: EditarUsuarioDto })
  @ApiResponse({
    status: 200,
  })
  @Put('/editar/:idUsuario')
  async editarUsuario(
    @Body() params: EditarUsuarioDto,
    @Param('idUsuario') idUsuarioEditar: string,
    @UsuarioId() idUsuarioLogado: string,
  ) {
    return this.usuarioService.editarUsuario(
      idUsuarioLogado,
      idUsuarioEditar,
      params,
    );
  }


  @ApiOperation({ summary: 'Dados do usuario' })
  @Get('/dados/:idUsuario')
  async pagarUsuarioCorsan(
    @Param('idUsuario') idUsuarioEditar: string,
  ) {
    return this.usuarioService.pegarUsuarioPorId(idUsuarioEditar);
  }

  @ApiOperation({ summary: 'Alterar Senha' })
  @Put('/:idUsuario/alterar-senha')
  async alterarSenha(
    @Body('senha') senha: string,
    @Param('idUsuario') idUsuario: string,
    @UsuarioId() idUsuarioLogado: string,
  ) {
    return this.usuarioService.alterarSenha(
      idUsuarioLogado,
      idUsuario,
      senha,
    );
  }
}
