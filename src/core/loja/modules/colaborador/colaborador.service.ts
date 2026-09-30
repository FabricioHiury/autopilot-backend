import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import {
  AppErrorBadRequest,
  AppErrorInternal,
  AppErrorNotFound,
} from 'src/utils/errors/app-errors';
import {
  CriarColaboradorDto,
  EditarColaboradorDto,
  EditarStatusColaboradorDto,
} from './dto/colaborador.dto';
import * as bcrypt from 'bcrypt';
import { USUARIO_STATUS } from 'src/utils/enum/usuario-status.enum';
import { ListarColaboradoresDto } from './dto/listar-colaboradores.dto';
import { Loja, Prisma } from '@prisma/client';
import { USUARIO_PERFIL } from 'src/core/usuario/enum/perfil.enum';

@Injectable()
export class ColaboradorService {
  constructor(private readonly prisma: PrismaService) { }

  private normalizeEmail(email?: string) {
    return email?.trim().toLowerCase();
  }

  private async assertLojaExists(lojaId: string): Promise<Pick<Loja, 'id'>> {
    const loja = await this.prisma.loja.findUnique({
      where: { id: lojaId },
      select: { id: true },
    });
    if (!loja) throw new AppErrorNotFound('Loja não encontrada.');
    return loja;
  }

  private async ensureEmailAvailable(email: string, excludeUserId?: string) {
    const exists = await this.prisma.usuario.findFirst({
      where: {
        email,
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      },
      select: { id: true },
    });
    if (exists) {
      throw new AppErrorBadRequest('Já existe um usuário cadastrado com este email');
    }
  }

  private async assertCargosValid(cargos: string[]) {
    if (!cargos?.length) {
      throw new AppErrorBadRequest('É necessário informar os cargos do colaborador.');
    }
    const count = await this.prisma.cargo.count({
      where: { id: { in: cargos } },
    });
    if (count !== cargos.length) {
      throw new AppErrorBadRequest('Um ou mais cargos informados são inválidos.');
    }
  }

  async createColaborador(storeId: string, dto: CriarColaboradorDto) {
    if (!storeId || !dto) throw new AppErrorBadRequest('Parâmetros inválidos');

    const loja = await this.assertLojaExists(storeId);

    const email = this.normalizeEmail(dto.email)!;
    await this.ensureEmailAvailable(email);
    await this.assertCargosValid(dto.cargos ?? []);

    const result = await this.prisma.$transaction(async (tx) => {
      const senhaComHash = await bcrypt.hash(dto.senha, 10);

      const usuario = await tx.usuario.create({
        data: {
          email,
          senha: senhaComHash,
          nome: dto.nome,
          perfil: USUARIO_PERFIL.USUARIO,
          status: USUARIO_STATUS.ATIVO,
        },
        select: { id: true, nome: true, email: true },
      });

      const colaborador = await tx.colaborador.create({
        data: {
          idLoja: loja.id,
          idUsuario: usuario.id,
          nome: dto.nome,
          documentoFiscal: dto.documentoFiscal,
          whatsapp: dto.whatsapp,
          telefoneComplementar: dto.telefoneComplementar,
          status: USUARIO_STATUS.ATIVO,
          observacoes: dto.observacoes,
          cargos: { connect: (dto.cargos ?? []).map((id) => ({ id })) },
        },
        select: {
          idLoja: true,
          idUsuario: true,
          documentoFiscal: true,
          whatsapp: true,
          telefoneComplementar: true,
          observacoes: true,
          status: true,
          criadoEm: true,
        },
      });

      if (dto.funcionalidades?.length) {
        await tx.permissao.createMany({
          data: dto.funcionalidades.map((func) => ({
            idUsuario: usuario.id,
            funcionalidade: func,
            status: USUARIO_STATUS.ATIVO,
          })),
          skipDuplicates: true,
        });
      }

      return {
        idLoja: colaborador.idLoja,
        idUsuario: colaborador.idUsuario,
        nome: usuario.nome,
        email: usuario.email,
        documentoFiscal: colaborador.documentoFiscal,
        whatsapp: colaborador.whatsapp,
        telefoneComplementar: colaborador.telefoneComplementar,
        observacoes: colaborador.observacoes,
        status: colaborador.status,
        criadoEm: colaborador.criadoEm,
        permissoes: dto.funcionalidades ?? [],
      };
    });

    if (!result) throw new AppErrorInternal('Erro ao criar colaborador');
    return result;
  }

  async updateColaborador(colaboradorId: string, storeId: string, dto: EditarColaboradorDto) {
    if (!colaboradorId || !storeId || !dto) throw new AppErrorBadRequest('Parâmetros inválidos');

    const loja = await this.assertLojaExists(storeId);

    const existente = await this.prisma.colaborador.findUnique({
      where: { id: colaboradorId, idLoja: loja.id, status: USUARIO_STATUS.ATIVO },
      select: {
        id: true,
        idUsuario: true,
        idLoja: true,
        usuario: { select: { email: true } },
      },
    });

    if (!existente) throw new AppErrorNotFound('Colaborador não encontrado.');

    const { email, senha, funcionalidades, cargos, ...colaboradorData } = dto;

    if (cargos) await this.assertCargosValid(cargos);

    const novoEmail = this.normalizeEmail(email);
    if (novoEmail && novoEmail !== existente.usuario.email) {
      await this.ensureEmailAvailable(novoEmail, existente.idUsuario);
    }

    const senhaComHash = senha ? await bcrypt.hash(senha, 10) : undefined;

    await this.prisma.$transaction(async (tx) => {
      // Permissões
      await tx.permissao.deleteMany({ where: { idUsuario: existente.idUsuario } });
      if (funcionalidades?.length) {
        await tx.permissao.createMany({
          data: funcionalidades.map((f) => ({
            idUsuario: existente.idUsuario,
            funcionalidade: f,
            status: USUARIO_STATUS.ATIVO,
          })),
          skipDuplicates: true,
        });
      }

      // Colaborador + Usuário
      await tx.colaborador.update({
        where: { id: colaboradorId, idLoja: loja.id },
        data: {
          ...colaboradorData,
          ...(cargos ? { cargos: { set: cargos.map((id) => ({ id })) } } : {}),
          usuario: {
            update: {
              ...(novoEmail ? { email: novoEmail } : {}),
              ...(senhaComHash ? { senha: senhaComHash } : {}),
            },
          },
        },
      });
    });

    // Retorna entidade atualizada
    const atualizado = await this.prisma.colaborador.findUnique({
      where: { id: colaboradorId, idLoja: loja.id },
      include: {
        usuario: {
          select: {
            email: true
          },
        },
        cargos: true,
      },
    });

    if (!atualizado) throw new AppErrorInternal('Erro ao atualizar colaborador.');
    return atualizado;
  }

  async getAllColaborators(storeId: string, params: ListarColaboradoresDto) {
    const pagina = params.pagina ? +params.pagina : 1;
    const quantidade = params.quantidade ? +params.quantidade : 10;
    const pesquisa = params.pesquisa?.trim() ?? '';
    const cargoFiltro = params.cargo?.trim() ?? '';

    const whereBase: Prisma.ColaboradorWhereInput = {
      idLoja: storeId,
      status: USUARIO_STATUS.ATIVO,
      ...(cargoFiltro
        ? {
          cargos: {
            some: { cargo: { contains: cargoFiltro, mode: 'insensitive' } },
          },
        }
        : {}),
    };

    const wherePesquisa: Prisma.ColaboradorWhereInput = pesquisa
      ? {
        ...whereBase,
        OR: [
          { nome: { contains: pesquisa, mode: 'insensitive' } },
          {
            usuario: {
              email: { contains: pesquisa, mode: 'insensitive' },
            },
          },
        ],
      }
      : whereBase;

    const [colaboradores, totalColaboradores] = await this.prisma.$transaction([
      this.prisma.colaborador.findMany({
        where: wherePesquisa,
        include: {
          usuario: {
            include: {
              permissao: { select: { funcionalidade: true } },
            },
          },
          cargos: true,
        },
        skip: (pagina - 1) * quantidade,
        take: quantidade,
        orderBy: { criadoEm: 'desc' },
      }),
      this.prisma.colaborador.count({ where: wherePesquisa }),
    ]);

    const totalPaginas = Math.max(1, Math.ceil(totalColaboradores / quantidade));

    const colaboratorsFormatted = colaboradores.map((c) => ({
      id: c.id,
      idLoja: c.idLoja,
      cargos: c.cargos,
      idUsuario: c.idUsuario,
      nome: c.nome,
      avatar: c.usuario.urlFoto || c.urlFoto || null,
      documentoFiscal: c.documentoFiscal,
      whatsapp: c.whatsapp,
      telefoneComplementar: c.telefoneComplementar,
      status: c.status,
      observacoes: c.observacoes,
      criadoEm: c.criadoEm,
      atualizadoEm: c.atualizadoEm,
      email: c.usuario.email
    }));

    return {
      pesquisa,
      pagina,
      quantidade,
      totalPaginas,
      totalColaboradores,
      colaboradores: colaboratorsFormatted,
    };
  }

  async getColaborador(colaboradorId: string, storeId: string) {
    if (!colaboradorId || !storeId) throw new AppErrorBadRequest('Parâmetros inválidos');

    const colaborador = await this.prisma.colaborador.findUnique({
      where: { id: colaboradorId, idLoja: storeId, status: USUARIO_STATUS.ATIVO },
      select: {
        usuario: {
          select: {
            email: true,
            nome: true,
            permissao: { select: { funcionalidade: true } },
          },
        },
        criadoEm: true,
        documentoFiscal: true,
        nome: true,
        whatsapp: true,
        telefoneComplementar: true,
        tarefasAtendimento: true,
        status: true,
        id: true,
        cargos: true,
        idUsuario: true,
        atendimentoResponsaveis: true,
        observacoes: true,
      },
    });

    if (!colaborador) throw new AppErrorNotFound('Colaborador não encontrado.');

    const { usuario, ...rest } = colaborador;
    const permissions = usuario.permissao.map((p) => p.funcionalidade);

    return {
      ...rest,
      email: usuario.email,
      funcionalidades: permissions,
    };
  }

  async updateColaboradorStatus(colaboradorId: string, storeId: string, dto: EditarStatusColaboradorDto) {
    if (!colaboradorId || !storeId || !dto) throw new AppErrorBadRequest('Parâmetros inválidos');

    const loja = await this.assertLojaExists(storeId);

    const colaborador = await this.prisma.colaborador.findUnique({
      where: { id: colaboradorId, idLoja: loja.id },
      select: { id: true, idUsuario: true },
    });
    if (!colaborador) throw new AppErrorNotFound('Colaborador não encontrado.');

    const atualizado = await this.prisma.colaborador.update({
      where: { id: colaboradorId, idLoja: loja.id },
      data: { status: dto.status },
      select: { id: true, idUsuario: true, status: true },
    });

    if (!atualizado) throw new AppErrorInternal('Erro ao atualizar status do colaborador.');

    if (atualizado.status === USUARIO_STATUS.INATIVO) {
      await this.prisma.$transaction(async (tx) => {
        await tx.permissao.deleteMany({ where: { idUsuario: atualizado.idUsuario } });
        await tx.usuario.update({
          where: { id: atualizado.idUsuario },
          data: {
            status: USUARIO_STATUS.INATIVO,
            email: `${Math.random().toString(36).slice(2)}@removi.do`,
          },
        });
      });
    }

    return atualizado;
  }
}