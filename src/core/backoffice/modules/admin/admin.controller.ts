import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  BuscarAdminPorIdDoc,
  BuscarDadosAdminLogadoDoc,
  ConcederPermissoesDoc,
  CriarUsuarioAdminDoc,
  DeletarUsuarioAdminDoc,
  EditarAdminLogadoDoc,
  EditarUsuarioAdminDoc,
  ListarPermissoesValidasDoc,
  ListarUsuariosAdminDoc,
  RemoverPermissoesDoc,
} from './docs/admin.swagger';
import { AdminService } from './admin.service';
import { CriarUsuarioAdminDto } from './dto/criar-usuario-admin.dto';
import { USUARIO_PERFIL } from 'src/core/usuario/enum/perfil.enum';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { PerfilGuard } from 'src/auth/auth/roles-decorators/perfil/perfil.guard';
import { Perfil } from 'src/auth/auth/roles-decorators/perfil/perfil.decorator';
import { Permissoes } from 'src/auth/auth/roles-decorators/permissoes/permissoes.decorator';
import { PERMISSOES_AUTOPILOT } from 'src/core/usuario/enum/permissoes_funcionalidades.enum';
import { ApiTags } from '@nestjs/swagger';
import { PermissoesAdminDto } from './dto/permissoes-admin.dto';
import { EditarUsuarioAdminDto } from './dto/editar-usuario-admin.dto';
import { UsuarioId } from 'src/auth/auth/decorators/usuario-id-decorator';
import { EditarAdminLogadoDto } from './dto/editar-admin-logado.dto';
import { ListarUsuariosAdminDto } from './dto/listar-usuarios-admin.dto';
import { PermissoesGuard } from 'src/auth/auth/roles-decorators/permissoes/permissoes.guard';

@UseGuards(JwtAuthGuard, PerfilGuard, PermissoesGuard)
@Perfil(USUARIO_PERFIL.AUTOPILOT)
@ApiTags('AutoPilot - admin')
@Controller('backoffice/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @ListarPermissoesValidasDoc()
  @Get('/listar-permissoes')
  async listarPermissoesValidas() {
    return await this.adminService.listarPermissoesValidas();
  }

  @BuscarDadosAdminLogadoDoc()
  @Get('/')
  async buscarDadosAdminLogado(@UsuarioId() idUsuario: string) {
    return await this.adminService.buscarAdminPorId(idUsuario);
  }

  @ListarUsuariosAdminDoc()
  @Permissoes([PERMISSOES_AUTOPILOT.AUTOPILOT_VER_USUARIOS_ADMIN])
  @Get('/usuarios')
  async listarUsuarios(@Query() params: ListarUsuariosAdminDto) {
    return await this.adminService.listarUsuariosAdmin(params);
  }

  @BuscarAdminPorIdDoc()
  @Permissoes([PERMISSOES_AUTOPILOT.AUTOPILOT_VER_USUARIOS_ADMIN])
  @Get('/:idUsuario')
  async buscarAdminPorId(@Param('idUsuario') idUsuario: string) {
    return await this.adminService.buscarAdminPorId(idUsuario);
  }

  @CriarUsuarioAdminDoc()
  @Permissoes([PERMISSOES_AUTOPILOT.AUTOPILOT_CRIAR_USUARIO_ADMIN])
  @Post('/cadastrar-usuario-admin')
  async criarUsuarioAdmin(@Body() params: CriarUsuarioAdminDto) {
    return await this.adminService.criarUsuarioAdmin(params);
  }

  @ConcederPermissoesDoc()
  @Permissoes([PERMISSOES_AUTOPILOT.AUTOPILOT_ATUALIZAR_PERMISSOES])
  @Put('/usuario/:idUsuario/conceder-permissoes')
  async concederPermissoes(
    @Param('idUsuario') idUsuario: string,
    @UsuarioId() idUsuarioLogado: string,
    @Body() params: PermissoesAdminDto,
  ) {
    return await this.adminService.concederPermissoes(
      idUsuarioLogado,
      idUsuario,
      params,
    );
  }

  @EditarUsuarioAdminDoc()
  @Permissoes([PERMISSOES_AUTOPILOT.AUTOPILOT_CRIAR_USUARIO_ADMIN])
  @Put('/usuario/:idUsuario/editar')
  async editarUsuarioAdmin(
    @Param('idUsuario') idUsuario: string,
    @Body() params: EditarUsuarioAdminDto,
  ) {
    return await this.adminService.editarUsuarioAdmin(idUsuario, params);
  }

  // não é necessária nenhuma permissão adicional para o usuário editar os próprios dados
  @EditarAdminLogadoDoc()
  @Put('/editar')
  async editarAdminLogado(
    @UsuarioId() idUsuario: string,
    @Body() params: EditarAdminLogadoDto,
  ) {
    return await this.adminService.editarAdminLogado(idUsuario, params);
  }

  @DeletarUsuarioAdminDoc()
  @Permissoes([PERMISSOES_AUTOPILOT.AUTOPILOT_CRIAR_USUARIO_ADMIN])
  @Delete('usuario/:idUsuario/deletar')
  async deletarUsuarioAdmin(
    @Param('idUsuario') idUsuario: string,
    @UsuarioId() idUsuarioLogado: string,
  ) {
    return await this.adminService.deletarUsuarioAdmin(
      idUsuarioLogado,
      idUsuario,
    );
  }

  @RemoverPermissoesDoc()
  @Permissoes([PERMISSOES_AUTOPILOT.AUTOPILOT_ATUALIZAR_PERMISSOES])
  @Delete('usuario/:idUsuario/remover-permissoes')
  async removerPermissoes(
    @Param('idUsuario') idUsuario: string,
    @UsuarioId() idUsuarioLogado: string,
    @Body() params: PermissoesAdminDto,
  ) {
    return await this.adminService.removerPermissoes(
      idUsuarioLogado,
      idUsuario,
      params,
    );
  }
}
