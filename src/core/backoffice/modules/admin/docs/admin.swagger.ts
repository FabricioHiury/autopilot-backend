import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { CriarUsuarioAdminDto } from '../dto/criar-usuario-admin.dto';
import { CriarUsuarioAdminSucesso } from './endpoints/criar-usuario-admin';
import { ConcederPermissoesSucesso } from './endpoints/conceder-permissoes';
import { PermissoesAdminDto } from '../dto/permissoes-admin.dto';
import { RemoverPermissoesSucesso } from './endpoints/remover-permissoes';
import { EditarAdminLogadoSucesso } from './endpoints/editar-admin-logado';
import { EditarUsuarioAdminSucesso } from './endpoints/editar-usuario-admin';
import { EditarUsuarioAdminDto } from '../dto/editar-usuario-admin.dto';
import { EditarAdminLogadoDto } from '../dto/editar-admin-logado.dto';
import { DeletarUsuarioAdminSucesso } from './endpoints/deletar-usuario-admin';
import { ListarUsuariosAdminDto } from '../dto/listar-usuarios-admin.dto';
import { ListarUsuariosAdminSucesso } from './endpoints/listar-usuarios-admin';
import { BuscarAdminPorIdSucesso } from './endpoints/buscar-admin-por-id';
import { BuscarDadosAdminLogadoSucesso } from './endpoints/buscar-dados-admin-logado';
import { ListarPermissoesValidasSucesso } from './endpoints/listar-permissoes-validas';
import { PERMISSOES_AUTOPILOT } from 'src/core/usuario/enum/permissoes_funcionalidades.enum';

const description = `Necessário token de autenticação de um usuário com perfil "autopilot"`;

export function ListarPermissoesValidasDoc() {
  return applyDecorators(
    ApiOperation({
      summary: `Lista todas as permissões de backoffice possíveis do sistema`,
      description,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: ListarPermissoesValidasSucesso,
    }),
  );
}

export function ListarUsuariosAdminDoc() {
  return applyDecorators(
    ApiOperation({
      summary: `Lista usuários com perfil "autopilot"`,
      description:
        description +
        ` . Permissão necessária: ${PERMISSOES_AUTOPILOT.AUTOPILOT_VER_USUARIOS_ADMIN}\n\nOBS: Os parâmetros de filtragem só aparecem na resposta caso sejam enviados na requisição`,
    }),

    ApiBody({ type: ListarUsuariosAdminDto }),

    ApiResponse({
      status: HttpStatus.OK,
      type: ListarUsuariosAdminSucesso,
    }),
  );
}

export function BuscarDadosAdminLogadoDoc() {
  return applyDecorators(
    ApiOperation({
      summary: `Retorna os dados do usuário com perfil "autopilot" logado`,
      description,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: BuscarDadosAdminLogadoSucesso,
    }),
  );
}

export function BuscarAdminPorIdDoc() {
  return applyDecorators(
    ApiOperation({
      summary: `Busca um usuário com perfil "autopilot" por id`,
      description:
        description +
        `. Permissão necessária: ${PERMISSOES_AUTOPILOT.AUTOPILOT_VER_USUARIOS_ADMIN}`,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: BuscarAdminPorIdSucesso,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
    }),
  );
}

export function CriarUsuarioAdminDoc() {
  return applyDecorators(
    ApiOperation({
      summary: `Cria um usuário com perfil "autopilot"`,
      description:
        `Cria um usuário do tipo admin e envia um email com os dados de acesso para o email fornecido.\n` +
        description +
        `. Permissão necessária: ${PERMISSOES_AUTOPILOT.AUTOPILOT_CRIAR_USUARIO_ADMIN}`,
    }),

    ApiBody({ type: CriarUsuarioAdminDto }),

    ApiResponse({
      status: HttpStatus.CREATED,
      type: CriarUsuarioAdminSucesso,
    }),

    ApiResponse({
      status: HttpStatus.CONFLICT,
    }),

    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
    }),
  );
}

export function EditarUsuarioAdminDoc() {
  return applyDecorators(
    ApiOperation({
      summary: `Edita um usuário com perfil "autopilot"`,
      description:
        description +
        `. Permissão necessária: ${PERMISSOES_AUTOPILOT.AUTOPILOT_CRIAR_USUARIO_ADMIN}`,
    }),

    ApiBody({ type: EditarUsuarioAdminDto }),

    ApiResponse({
      status: HttpStatus.OK,
      type: EditarUsuarioAdminSucesso,
    }),

    ApiResponse({
      status: HttpStatus.CONFLICT,
    }),

    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
    }),
  );
}

export function EditarAdminLogadoDoc() {
  return applyDecorators(
    ApiOperation({
      summary: `Edita o usuário logado`,
      description,
    }),

    ApiBody({ type: EditarAdminLogadoDto }),

    ApiResponse({
      status: HttpStatus.OK,
      type: EditarAdminLogadoSucesso,
    }),

    ApiResponse({
      status: HttpStatus.CONFLICT,
    }),

    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
    }),
  );
}

export function DeletarUsuarioAdminDoc() {
  return applyDecorators(
    ApiOperation({
      summary: `Deleta permanentemente um usuário com perfil "autopilot"`,
      description:
        description +
        `. Permissão necessária: ${PERMISSOES_AUTOPILOT.AUTOPILOT_CRIAR_USUARIO_ADMIN}`,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: DeletarUsuarioAdminSucesso,
    }),
  );
}

export function ConcederPermissoesDoc() {
  return applyDecorators(
    ApiOperation({
      summary: `Concede permissões para um usuário com perfil "autopilot"`,
      description:
        description +
        `. Permissão necessária: ${PERMISSOES_AUTOPILOT.AUTOPILOT_ATUALIZAR_PERMISSOES}`,
    }),

    ApiBody({ type: PermissoesAdminDto }),

    ApiResponse({
      status: HttpStatus.OK,
      type: ConcederPermissoesSucesso,
    }),
  );
}

export function RemoverPermissoesDoc() {
  return applyDecorators(
    ApiOperation({
      summary: `Remove permissões de um usuário com perfil "autopilot"`,
      description:
        description +
        `. Permissão necessária: ${PERMISSOES_AUTOPILOT.AUTOPILOT_ATUALIZAR_PERMISSOES}`,
    }),

    ApiBody({ type: PermissoesAdminDto }),

    ApiResponse({
      status: HttpStatus.OK,
      type: RemoverPermissoesSucesso,
    }),
  );
}
