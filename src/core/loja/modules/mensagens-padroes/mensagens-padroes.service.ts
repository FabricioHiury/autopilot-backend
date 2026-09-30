import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import {
  AppErrorBadRequest,
  AppErrorNotFound,
} from 'src/utils/errors/app-errors';
import { CriarMensagemPadraoDto } from './dto/criar-mensagem-padrao.dto';
import { EditarMensagemPadraoDto } from './dto/editar-mensagem-padrao.dto';
import { ListarMensagensPadroesDto } from './dto/listar-mensagens-padroes.dto';

@Injectable()
export class MensagensPadroesService {
  constructor(private readonly prismaService: PrismaService) {}

  async criar(idLoja: string, data: CriarMensagemPadraoDto) {
    if (!idLoja) {
      throw new AppErrorBadRequest('ID da loja não informado');
    }

    const mensagemCriada = await this.prismaService.mensagemPadrao.create({
      data: {
        idLoja,
        titulo: data.titulo,
        conteudo: data.conteudo,
      },
    });

    return mensagemCriada;
  }

  async listar(idLoja: string, filtros: ListarMensagensPadroesDto) {
    if (!idLoja) {
      throw new AppErrorBadRequest('ID da loja não informado');
    }

    const { pesquisa = '', pagina = '1', itensPorPagina = '10' } = filtros;

    const paginaNumero = Number(pagina);
    const itensPorPaginaNumero = Number(itensPorPagina);

    const whereCondition: any = {
      idLoja,
    };

    if (pesquisa && pesquisa.trim() !== '') {
      whereCondition.OR = [
        {
          titulo: {
            contains: pesquisa,
            mode: 'insensitive',
          },
        },
        {
          conteudo: {
            contains: pesquisa,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [mensagens, total] = await Promise.all([
      this.prismaService.mensagemPadrao.findMany({
        where: whereCondition,
        skip: (paginaNumero - 1) * itensPorPaginaNumero,
        take: itensPorPaginaNumero,
        orderBy: {
          criadoEm: 'desc',
        },
      }),
      this.prismaService.mensagemPadrao.count({
        where: whereCondition,
      }),
    ]);

    return {
      mensagens,
      pagina: paginaNumero,
      itensPorPagina: itensPorPaginaNumero,
      total,
      totalPaginas: Math.ceil(total / itensPorPaginaNumero),
    };
  }

  async obterPorId(idLoja: string, id: string) {
    if (!idLoja) {
      throw new AppErrorBadRequest('ID da loja não informado');
    }

    if (!id) {
      throw new AppErrorBadRequest('ID da mensagem não informado');
    }

    const mensagem = await this.prismaService.mensagemPadrao.findUnique({
      where: {
        id,
        idLoja,
      },
    });

    if (!mensagem) {
      throw new AppErrorNotFound('Mensagem padrão não encontrada');
    }

    return mensagem;
  }

  async editar(idLoja: string, id: string, data: EditarMensagemPadraoDto) {
    await this.obterPorId(idLoja, id);

    if (!data.titulo && !data.conteudo) {
      throw new AppErrorBadRequest(
        'Informe ao menos um campo para atualizar',
      );
    }

    const mensagemAtualizada = await this.prismaService.mensagemPadrao.update({
      where: {
        id,
        idLoja,
      },
      data: {
        ...(data.titulo && { titulo: data.titulo }),
        ...(data.conteudo && { conteudo: data.conteudo }),
      },
    });

    return mensagemAtualizada;
  }

  async deletar(idLoja: string, id: string) {
    await this.obterPorId(idLoja, id);

    await this.prismaService.mensagemPadrao.delete({
      where: {
        id,
        idLoja,
      },
    });

    return { message: 'Mensagem padrão deletada com sucesso' };
  }
}
