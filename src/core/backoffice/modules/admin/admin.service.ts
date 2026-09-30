import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { CriarUsuarioAdminDto } from './dto/criar-usuario-admin.dto';
import { uuidv7 } from 'uuidv7';
import * as bcrypt from 'bcrypt';
import { USUARIO_PERFIL } from 'src/core/usuario/enum/perfil.enum';
import { MailService } from 'src/utils/mail/mail.service';
import {
  AppErrorConflict,
  AppErrorForbidden,
  AppErrorNotFound,
} from 'src/utils/errors/app-errors';
import { PermissoesAdminDto } from './dto/permissoes-admin.dto';
import { EditarUsuarioAdminDto } from './dto/editar-usuario-admin.dto';
import { EditarAdminLogadoDto } from './dto/editar-admin-logado.dto';
import { ListarUsuariosAdminDto } from './dto/listar-usuarios-admin.dto';
import { Prisma } from '@prisma/client';
import { PERMISSOES_AUTOPILOT } from 'src/core/usuario/enum/permissoes_funcionalidades.enum';
import { getStringUrlAvatar } from 'src/utils/avatarUtils';

@Injectable()
export class AdminService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly mailService: MailService,
  ) {}

  private readonly usuarioSelect: Prisma.UsuarioSelect = {
    id: true,
    email: true,
    nome: true,
    status: true,
    perfil: true,
    criadoEm:true,
    permissao: {
      select: {
        funcionalidade: true,
      },
    },
  };

  private async checarEmailUnico(email: string, idUsuario?: string) {
    const emailExiste = await this.prismaService.usuario.findUnique({
      where: {
        email,
      },
    });

    if (idUsuario && emailExiste && emailExiste.id === idUsuario) {
      return;
    }

    if (emailExiste) {
      throw new AppErrorConflict('E-mail já cadastrado.');
    }
  }

  async listarPermissoesValidas() {
    return Object.values(PERMISSOES_AUTOPILOT);
  }

  async buscarAdminPorId(idUsuario: string) {
    const usuario = await this.prismaService.usuario.findUnique({
      where: {
        id: idUsuario,
        perfil: USUARIO_PERFIL.AUTOPILOT,
        status: {
          not: 'excluido',
        },
      },
      select: this.usuarioSelect,
    });

    if (!usuario) {
      throw new AppErrorNotFound('Usuário admin não encontrado.');
    }

    const permissoes =
      usuario.permissao?.map((permissao) => permissao.funcionalidade) ?? [];

    return {
      ...usuario,
      avatarUrl: getStringUrlAvatar(usuario.id),
      permissao: undefined,
      permissoes,
    };
  }

  async listarUsuariosAdmin(params: ListarUsuariosAdminDto) {
    const pagina = params.pagina ? +params.pagina : 1;
    const itensPorPagina = params.itensPorPagina ? +params.itensPorPagina : 6;
    const pesquisa = params.pesquisa || '';
    let status = params.status ?? undefined;

    if (status === 'todos') {
      status = undefined;
    }

    const dataInicial = params.dataInicial
      ? new Date(params.dataInicial)
      : undefined;

    const dataFinal = params.dataFinal ? new Date(params.dataFinal) : undefined;

    const where: Prisma.UsuarioWhereInput = {
      AND: [
        {
          perfil: USUARIO_PERFIL.AUTOPILOT,
          status: {
            equals: status,
            not: 'excluido',
          },

          criadoEm: {
            gte: dataInicial,
            lte: dataFinal,
          },
        },
        {
          OR: [
            {
              email: {
                contains: pesquisa,
                mode: 'insensitive',
              },
            },
            {
              nome: {
                contains: pesquisa,
                mode: 'insensitive',
              },
            },
          ],
        },
      ],
    };

    const usuarios = await this.prismaService.usuario.findMany({
      where,
      skip: (pagina - 1) * itensPorPagina,
      take: itensPorPagina,
      select: this.usuarioSelect,
    });

    const totalUsuarios = await this.prismaService.usuario.count({
      where,
    });

    const usuariosFormatados = usuarios.map((usuario) => {
      const permissoes =
        usuario.permissao?.map((permissao) => permissao.funcionalidade) ?? [];

      return {
        ...usuario,
        avatarUrl: getStringUrlAvatar(usuario.id),
        permissao: undefined,
        permissoes,
      };
    });

    return {
      pagina,
      itensPorPagina,
      totalPaginas: Math.ceil(totalUsuarios / itensPorPagina),
      totalUsuarios,
      pesquisa,
      status: params.status,
      dataInicial,
      dataFinal,
      usuarios: usuariosFormatados,
    };
  }

  async criarUsuarioAdmin(params: CriarUsuarioAdminDto) {
    const hash = await bcrypt.hash(params.senha, 10);

    await this.checarEmailUnico(params.email);

    const usuario = await this.prismaService.usuario.create({
      data: {
        email: params.email,
        senha: hash,
        nome: params.nome,
        perfil: USUARIO_PERFIL.AUTOPILOT,
      },
      select: {
        id: true,
        email: true,
        nome: true,
        perfil: true,
      },
    });

    const permissoesUnicas = Array.from(new Set(params.permissoes));

    await this.prismaService.permissao.createMany({
      data: permissoesUnicas.map((permissao) => ({
        idUsuario: usuario.id,
        funcionalidade: permissao,
      })),
    });

    await this.mailService.enviarDadosDeAcesso({
      email: params.email,
      senha: params.senha,
      nome: params.nome,
      observacoes: params.observacoes,
    });

    const usuarioAtualizado = await this.buscarAdminPorId(usuario.id);

    return usuarioAtualizado;
  }

  async editarUsuarioAdmin(idUsuario: string, params: EditarUsuarioAdminDto) {
    if (params.email) {
      await this.checarEmailUnico(params.email, idUsuario);
    }

    const usuario = await this.buscarAdminPorId(idUsuario);

    await this.prismaService.usuario.update({
      where: {
        id: idUsuario,
      },
      data: {
        ...params,
      },
    });

    return {
      ...usuario,
      ...params,
    };
  }

  async editarAdminLogado(idUsuario: string, params: EditarAdminLogadoDto) {
    if (params.email) {
      await this.checarEmailUnico(params.email, idUsuario);
    }

    const paramsParaAtualizar = { ...params };

    if (params.senha) {
      paramsParaAtualizar.senha = await bcrypt.hash(params.senha, 10);
    }

    await this.prismaService.usuario.update({
      where: {
        id: idUsuario,
      },
      data: {
        ...paramsParaAtualizar,
      },
    });

    const usuarioEditado = await this.buscarAdminPorId(idUsuario);

    return usuarioEditado;
  }

  async deletarUsuarioAdmin(idUsuarioLogado: string, idUsuario: string) {
    if (idUsuarioLogado === idUsuario) {
      throw new AppErrorForbidden('Você não pode deletar sua própria conta.');
    }

    const usuario = await this.buscarAdminPorId(idUsuario);

    const uniqueId = uuidv7();

    const emailUnico = `${usuario.email}+${uniqueId}`;

    const usuarioExcluido = await this.prismaService.$transaction(
      async (prisma) => {
        await prisma.permissao.deleteMany({
          where: {
            idUsuario,
          },
        });

        return await prisma.usuario.update({
          where: {
            id: idUsuario,
          },
          data: {
            status: 'excluido',
            email: emailUnico,
          },
          select: this.usuarioSelect,
        });
      },
    );

    return usuarioExcluido;
  }

  async concederPermissoes(
    idUsuarioLogado: string,
    idUsuario: string,
    params: PermissoesAdminDto,
  ) {
    if (idUsuarioLogado === idUsuario) {
      throw new AppErrorForbidden(
        'Você não pode alterar suas próprias permissões.',
      );
    }

    const usuario = await this.buscarAdminPorId(idUsuario);

    const novasPermissoes = params.permissoes.filter(
      (permissao) => !usuario.permissoes?.includes(permissao),
    );

    if (novasPermissoes.length === 0) {
      return {
        ...usuario,
        permissoes: usuario.permissoes ?? [],
        permissao: undefined,
      };
    }

    await this.prismaService.permissao.createMany({
      data: novasPermissoes.map((permissao) => ({
        idUsuario: usuario.id,
        funcionalidade: permissao,
      })),
    });

    const usuarioAtualizado = await this.buscarAdminPorId(idUsuario);

    return usuarioAtualizado;
  }

  async removerPermissoes(
    idUsuarioLogado: string,
    idUsuario: string,
    params: PermissoesAdminDto,
  ) {
    if (idUsuarioLogado === idUsuario) {
      throw new AppErrorForbidden(
        'Você não pode alterar suas próprias permissões.',
      );
    }

    const usuario = await this.buscarAdminPorId(idUsuario);

    const permissoesParaRemover = params.permissoes.filter((permissao) =>
      usuario.permissoes?.includes(permissao),
    );

    if (permissoesParaRemover.length === 0) {
      return {
        ...usuario,
        permissoes: usuario.permissoes ?? [],
        permissao: undefined,
      };
    }

    await this.prismaService.permissao.deleteMany({
      where: {
        idUsuario,
        funcionalidade: {
          in: permissoesParaRemover,
        },
      },
    });

    const usuarioAtualizado = await this.buscarAdminPorId(idUsuario);

    return usuarioAtualizado;
  }
}
