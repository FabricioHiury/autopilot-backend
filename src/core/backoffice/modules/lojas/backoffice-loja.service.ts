import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { getStringUrlAvatar } from 'src/utils/avatarUtils';
import { ListarLojasAdminDto } from './dto/listar-lojas-admin.dto';
import axios from 'axios';
import { ConfigurarIntegracaoWppDto } from './dto/configurar-integracao-whatsapp.dto';
import {
  AppErrorInternal,
  AppErrorNotFound,
} from 'src/utils/errors/app-errors';
import { uuidv4 } from 'uuidv7';

@Injectable()
export class BackofficeLojaService {
  constructor(private readonly prismaService: PrismaService) {}

  private instanciaAxios() {
    return axios.create({
      baseURL: process.env.API_BASE_URL,
      headers: {
        'x-micro-token': process.env.API_KEY,
      },
    });
  }

  async listarLojas(params: ListarLojasAdminDto) {
    const pagina = params.pagina ? +params.pagina : 1;
    const itensPorPagina = params.itensPorPagina ? +params.itensPorPagina : 10;
    const pesquisa = params.pesquisa || '';
    let wppConfigurado: boolean | undefined;

    if (params.wppConfigurado) {
      wppConfigurado = params.wppConfigurado === 'true';
    }

    const dataInicial = params.dataInicial
      ? new Date(params.dataInicial)
      : undefined;

    const dataFinal = params.dataFinal ? new Date(params.dataFinal) : undefined;

    const where: Prisma.LojaWhereInput = {
      criadoEm: {
        gte: dataInicial,
        lte: dataFinal,
      },
      wppConfigurado,
      OR: [
        {
          nomeEmpresa: {
            contains: pesquisa,
            mode: 'insensitive',
          },
        },
        {
          cnpj: {
            contains: pesquisa,
            mode: 'insensitive',
          },
        },
      ],
    };

    const lojas = await this.prismaService.loja.findMany({
      where,
      select: {
        id: true,
        nomeEmpresa: true,
        cnpj: true,
        wppConfigurado: true,
        criadoEm: true,
        lojista: {
          select: {
            idUsuario: true,
            usuario: {
              select: {
                email: true,
              },
            },
          },
        },
      },
      skip: (pagina - 1) * itensPorPagina,
      take: itensPorPagina,
    });

    const totalLojas = await this.prismaService.loja.count({
      where,
    });

    const lojasFormatadas =
      lojas?.map((loja) => ({
        ...loja,
        email: loja.lojista?.usuario.email,
        avatarUrl: getStringUrlAvatar(loja.lojista?.idUsuario),
        lojista: undefined,
      })) || [];

    return {
      pagina,
      itensPorPagina,
      totalPaginas: Math.ceil(totalLojas / itensPorPagina),
      wppConfigurado: params.wppConfigurado,
      pesquisa,
      dataInicial,
      dataFinal,
      lojas: lojasFormatadas,
    };
  }

  async configurarIntegracaoWpp(params: ConfigurarIntegracaoWppDto) {
    const loja = await this.prismaService.loja.findUnique({
      where: {
        id: params.idLoja,
      },
      select: {
        id: true,
      },
    });

    if (!loja) {
      throw new AppErrorNotFound('Loja não encontrada');
    }

    const token = await this.prismaService.loja.update({
      where: {
        id: loja.id,
      },
      data: {
        integracoesLiberadas: true,
        wppConfigurado: true,
        wppInstancia: uuidv4(),
      },
    });

    await this.instanciaAxios().put(`/integrations/whatsapp`, {
      instanceId: token.wppInstancia,
      storeId: String(loja.id),
    });

    return token;
  }
}
