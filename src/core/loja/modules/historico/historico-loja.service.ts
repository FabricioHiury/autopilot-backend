import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { OnEvent } from '@nestjs/event-emitter';
import { IHistoricoLojaDto } from './interfaces/historico-loja.interface';
import { ListarHistoricoLojaDto } from './dto/listar-historico-loja.dto';
import { endOfDay, startOfDay } from 'date-fns';
import { Prisma } from '@prisma/client';

@Injectable()
export class HistoricoLojaService {
  constructor(private readonly prismaService: PrismaService) {}

  @OnEvent('loja.evento')
  private async logarEventoLoja(params: IHistoricoLojaDto) {
    const loja = await this.prismaService.loja.findUnique({
      where: {
        id: params.idLoja,
      },
    });

    if (!loja) {
      throw new Error('Loja não encontrada');
    }

    await this.prismaService.historicoLoja.create({
      data: {
        idLoja: params.idLoja,
        tipoEvento: params.tipoEvento,
        descricao: params.descricao,
      },
    });
  }

  async listarHistoricoLoja(idLoja: string, params: ListarHistoricoLojaDto) {
    const pagina = params.pagina ? +params.pagina : 1;
    const itensPorPagina = params.itensPorPagina ? +params.itensPorPagina : 10;
    const pesquisa = params.pesquisa || '';

    const dataInicial = params.dataInicial
      ? startOfDay(new Date(params.dataInicial))
      : undefined;

    const dataFinal = params.dataFinal
      ? endOfDay(new Date(params.dataFinal))
      : undefined;

    const where: Prisma.HistoricoLojaWhereInput = {
      AND: [
        {
          idLoja,
          criadoEm: {
            gte: dataInicial,
            lte: dataFinal,
          },
        },
        {
          OR: [
            {
              tipoEvento: {
                contains: pesquisa,
                mode: 'insensitive',
              },
            },
            {
              descricao: {
                contains: pesquisa,
                mode: 'insensitive',
              },
            },
          ],
        },
      ],
    };

    const historico = await this.prismaService.historicoLoja.findMany({
      where,
      take: itensPorPagina,
      skip: (pagina - 1) * itensPorPagina,
    });

    const total = await this.prismaService.historicoLoja.count({
      where,
    });

    return {
      pagina,
      itensPorPagina,
      totalPaginas: Math.ceil(total / itensPorPagina),
      dataInicial,
      dataFinal,
      items: historico,
    };
  }
}
