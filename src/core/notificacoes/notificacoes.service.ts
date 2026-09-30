import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { StatusNotificacaoEnum } from 'src/utils/enum/notificacoes.enum';
import { AlterarStatusNotificacaoDto, CriarNotificacaoDto, ListarNotificacaoDto } from './dto/notificacoes.dto';
import { ListarNotificacaoResonseDto } from './dto/response/notificacoes.dto';
import { Prisma } from '@prisma/client';
import { NovuService } from '../novu/novu.service';

@Injectable()
export class NotificacoesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly novuService: NovuService,
  ) {}

  async listarNotificacoes(idUsuario: string, query: ListarNotificacaoDto) {
    const { status } = query;

    const where: Prisma.NotificacaoWhereInput = {
      idUsuario: idUsuario,
      status: status ? { equals: status } : undefined,
    }

    const [notificacoes, totalVisualizadas, totalPendentes] = await Promise.all([
      this.prismaService.notificacao.findMany({
        where,
        take: 100,
        orderBy: {
          criadoEm: 'desc',
        },
      }),
      this.prismaService.notificacao.count({
        where: {
          idUsuario: idUsuario,
          status: StatusNotificacaoEnum.VISUALIZADO,
        },
      }),
      this.prismaService.notificacao.count({
        where: {
          idUsuario: idUsuario,
          status: StatusNotificacaoEnum.PENDENTE,
        },
      }),
    ]);

    return {
      notificacoes,
      total: totalPendentes + totalVisualizadas,
      totalVisualizadas,
      totalPendentes,
    }
  }

  async alterarNotificacao(
    alterarDto: AlterarStatusNotificacaoDto,
    idNotificacao: string,
  ) {
    return await this.prismaService.notificacao.update({
      where: {
        id: idNotificacao,
      },
      data: alterarDto,
    });
  }

  async criarNovaNotificacao(criarNotificacao: CriarNotificacaoDto) {
    const notificacao = await this.prismaService.notificacao.create({
      data: {
        idUsuario: criarNotificacao.idUsuario,
        idReferencia: criarNotificacao.idReferencia,
        mensagem: criarNotificacao.mensagem,
        tipo: criarNotificacao.tipo,
        status: StatusNotificacaoEnum.PENDENTE,
      },
    });

    this.novuService.triggerPushNotification({
      subscriberId: criarNotificacao.idUsuario,
      tipo: criarNotificacao.tipo,
      mensagem: criarNotificacao.mensagem,
      idReferencia: criarNotificacao.idReferencia,
    }).catch(() => {});

    return notificacao;
  }

  async marcarTodasComoLidas(idUsuario: string) {
    return await this.prismaService.notificacao.updateMany({
      where: {
        idUsuario,
        status: StatusNotificacaoEnum.PENDENTE,
      },
      data: {
        status: StatusNotificacaoEnum.VISUALIZADO,
      },
    });
  }
}

