import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { USUARIO_PERFIL } from './enum/perfil.enum';
import { CriarUsuarioDto } from './dto/in/criar-usuario.dto';
import { EditarUsuarioDto } from './dto/in/editar-usuario.dto';
import { ListarUsuariosDto } from './dto/in/listar-usuario.dto';
import { Prisma } from '@prisma/client';
import {
  AppErrorBadRequest,
  AppErrorConflict,
  AppErrorNotFound,
  AppErrorUnauthorized,
} from 'src/utils/errors/app-errors';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuarioService {
  constructor(private readonly prismaService: PrismaService) {}

  private selectQuery: Prisma.UsuarioSelect = {
    id: true,
    email: true,
    nome: true,
    status: true,
    perfil: true,
    criadoEm: true,
    atualizadoEm: true,
  
  };

  private async pegarPerfilAdmin(idUsuario: string) {
    const usuario = await this.prismaService.usuario.findUnique({
      where: {
        id: idUsuario,
        perfil: USUARIO_PERFIL.LOJISTA,
      },
    });

    if (!usuario) {
      throw new AppErrorUnauthorized('Usuário não autorizado.');
    }

    return usuario;
  }

  async listarUsuarios(perfil: string, params: ListarUsuariosDto) {
    const pagina = params.pagina ? +params.pagina : 1;
    const quantidade = params.quantidade ? +params.quantidade : 10;
    const pesquisa = params.pesquisa ? params.pesquisa : '';
    const status = params.status ? params.status : 'todos';

    const where: Prisma.UsuarioWhereInput = {
      AND: [
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
        { perfil },
        status === 'todos' ? {} : { status },
      ],
    };

    const totalUsuarios = await this.prismaService.usuario.count({
      where: where,
    });

    const usuarios = await this.prismaService.usuario.findMany({
      where: where,
      skip: (pagina - 1) * quantidade,
      take: quantidade,
      select: this.selectQuery,
      orderBy: {
        id: 'desc',
      },
    });

    return {
      total: totalUsuarios,
      pagina,
      totalPaginas: Math.ceil(totalUsuarios / quantidade),
      pesquisa,
      status,
      usuarios: usuarios,
    };
  }

  async alterarSenha(
    idUsuario: string,
    idUsuarioEditar: string,
    senha: string,
  ) {
    // Verificar perfil Admin
    const usuarioAdmin = await this.pegarPerfilAdmin(idUsuario);

    if (!usuarioAdmin || idUsuario !== idUsuarioEditar) {
      throw new AppErrorUnauthorized('Usuário não autorizado.');
    }

    // Alterar senha
    const senhaHash = await bcrypt.hash(senha, 10);

    const usuario = await this.prismaService.usuario.update({
      where: {
        id: idUsuarioEditar,
      },
      data: {
        senha: senhaHash,
      },
      select: this.selectQuery,
    });

    return usuario;
  }

  async criarUsuario(criarUsuarioDto: CriarUsuarioDto) {
    const hash = await bcrypt.hash(criarUsuarioDto.senha, 10);

    return await this.prismaService.usuario.create({
      data: {
        email: criarUsuarioDto.email,
        senha: hash,
        nome: criarUsuarioDto.nome,
        perfil: criarUsuarioDto.perfil,
      },
      select: this.selectQuery,
    });
  }

  async pegarUsuarioPorId(idUsuarioEditar: string) {
    const usuario = await this.prismaService.usuario.findUnique({
      where: { id: idUsuarioEditar },
      select: this.selectQuery,
    });

    if (!usuario) {
      throw new AppErrorNotFound('Usuário não encontrado.');
    }

    return usuario;
  }

  async editarUsuario(
    idUsuario: string,
    idUsuarioEditar: string,
    params: EditarUsuarioDto,
  ) {
    const usuarioAdmin = await this.pegarPerfilAdmin(idUsuario);

    const usuario = await this.pegarUsuarioPorId(idUsuarioEditar);
    const status = usuarioAdmin ? params.status : usuario.status;

    if (params.email) {
      const usuarioEmail = await this.prismaService.usuario.findUnique({
        where: { email: params.email },
      });

      if (usuarioEmail && usuarioEmail.id !== idUsuarioEditar) {
        throw new AppErrorConflict('Email já cadastrado.');
      }
    }

    return await this.prismaService.usuario.update({
      where: { id: idUsuarioEditar },
      data: {
        email: params.email,
        status: status,
        nome: params.nome,
      },
      select: this.selectQuery,
    });
  }

  async verDadosDashboard(idUsuario: string) {
    const usuario = await this.prismaService.usuario.findUnique({
      where: { id: idUsuario },
    });

    if (!usuario) throw new AppErrorNotFound('Usuário não encontrado.');

    const dadosDashboard = {
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      status: usuario.status,
      criadoEm: usuario.criadoEm,
      atualizadoEm: usuario.atualizadoEm,
    };

    return dadosDashboard;
  }
}
