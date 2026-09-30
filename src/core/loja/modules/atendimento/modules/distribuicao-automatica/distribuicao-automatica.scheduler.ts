import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DistribuicaoAutomaticaService } from './distribuicao-automatica.service';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { SuspensaoService } from '../suspensao/suspensao.service';

@Injectable()
export class DistribuicaoAutomaticaScheduler {
  private readonly logger = new Logger(DistribuicaoAutomaticaScheduler.name);

  constructor(
    private readonly distribuicaoAutomaticaService: DistribuicaoAutomaticaService,
    private readonly prismaService: PrismaService,
    private readonly suspensaoService: SuspensaoService, 
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async monitorarSuspensoesERedistribuir() {
    try {
      this.logger.log('Iniciando monitoramento de suspensões e redistribuição automática');
      
      const lojasComDistribuicaoAutomatica = await this.prismaService.loja.findMany({
        where: {
          distribuicaoAutomatica: true,
        },
        select: {
          id: true,
          nomeEmpresa: true,
        },
      });

      if (lojasComDistribuicaoAutomatica.length === 0) {
        this.logger.log('Nenhuma loja com distribuição automática encontrada');
        return;
      }

      let totalRedistribuicoes = 0;

      for (const loja of lojasComDistribuicaoAutomatica) {
        try {
          this.logger.log(`Processando loja: ${loja.nomeEmpresa} (ID: ${loja.id})`);
          
          const redistribuicoesAntes = await this.contarAtendimentosAtivos(loja.id);
          
          await this.distribuicaoAutomaticaService.removerAtendimentosUsuariosSuspensos(loja.id);
          
          await this.redistribuirChatsUsuariosSuspensos(loja.id);
          
          const redistribuicoesDepois = await this.contarAtendimentosAtivos(loja.id);
          const redistribuicoesLoja = Math.abs(redistribuicoesDepois - redistribuicoesAntes);
          
          if (redistribuicoesLoja > 0) {
            this.logger.log(`Loja ${loja.nomeEmpresa}: ${redistribuicoesLoja} redistribuições realizadas`);
            totalRedistribuicoes += redistribuicoesLoja;
          }
        } catch (error) {
          this.logger.error(`Erro ao processar loja ${loja.nomeEmpresa} (ID: ${loja.id}):`, error);
        }
      }

      if (totalRedistribuicoes > 0) {
        this.logger.log(`Monitoramento concluído. Total de redistribuições: ${totalRedistribuicoes}`);
      } else {
        this.logger.log('Monitoramento concluído. Nenhuma redistribuição necessária');
      }
    } catch (error) {
      this.logger.error('Erro durante o monitoramento de suspensões:', error);
    }
  }

  private async contarAtendimentosAtivos(idLoja: string): Promise<number> {
    return await this.prismaService.atendimentoResponsaveis.count({
      where: {
        idLoja,
        atendimento: {
          status: {
            in: ['preAtendimento', 'atendimentoInicial', 'emNegociacao'],
          },
        },
      },
    });
  }

  private async redistribuirChatsUsuariosSuspensos(idLoja: string): Promise<void> {
    const agora = new Date();
    
    const suspensoesAtivas = await this.prismaService.suspensaoAtendimento.findMany({
      where: {
        startDate: { lte: agora },
        endDate: { gte: agora },
      },
      select: {
        idUsuario: true,
      },
    });
  
    if (suspensoesAtivas.length === 0) {
      return;
    }
  
    const idsUsuariosSuspensos = suspensoesAtivas.map(s => s.idUsuario);
  
    const colaboradoresSuspensos = await this.prismaService.colaborador.findMany({
      where: {
        idLoja,
        idUsuario: {
          in: idsUsuariosSuspensos,
        },
      },
      select: {
        id: true,
        cargos: true,
      },
    });
  
    if (colaboradoresSuspensos.length === 0) {
      return;
    }
  
    const idsColaboradoresSuspensos = colaboradoresSuspensos.map(c => c.id);
  
    const chatsComResponsaveisSuspensos = await this.prismaService.chat.findMany({
      where: {
        idLoja,
        atendimento: {
          atendimentoResponsaveis: {
            some: {
              idColaborador: {
                in: idsColaboradoresSuspensos,
              },
            },
          },
        },
      },
      include: {
        atendimento: {
          include: {
            atendimentoResponsaveis: {
              include: {
                colaborador: {
                  include: {
                    cargos: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    for (const chat of chatsComResponsaveisSuspensos) {
      if (!chat.atendimento) continue;

      const responsaveisSuspensos = chat.atendimento.atendimentoResponsaveis.filter(
        resp => idsColaboradoresSuspensos.includes(resp.idColaborador)
      );

      for (const responsavelSuspenso of responsaveisSuspensos) {
        const colaboradorSuspenso = responsavelSuspenso.colaborador;
        const cargosColaboradorSuspenso = colaboradorSuspenso.cargos.map(c => c.cargo.toLowerCase());
        
        let tipoColaborador: 'Pré-vendedor' | 'Vendedor' | undefined;
        
        if (cargosColaboradorSuspenso.some(cargo => cargo.includes('pré-vendedor') || cargo.includes('pre-vendedor'))) {
          tipoColaborador = 'Pré-vendedor';
        } else if (cargosColaboradorSuspenso.some(cargo => cargo.includes('vendedor') && !cargo.includes('pré'))) {
          tipoColaborador = 'Vendedor';
        }

        const novoColaboradorId = await this.distribuicaoAutomaticaService.obterColaboradorParaDistribuicao(idLoja, tipoColaborador);
        
        if (novoColaboradorId) {
          await this.prismaService.$transaction(async (prisma) => {
            await prisma.atendimentoResponsaveis.delete({
              where: {
                id: responsavelSuspenso.id,
              },
            });

            const jaEResponsavel = await prisma.atendimentoResponsaveis.findFirst({
              where: {
                idAtendimento: chat.atendimento.id,
                idColaborador: novoColaboradorId,
              },
            });

            if (!jaEResponsavel) {
              await prisma.atendimentoResponsaveis.create({
                data: {
                  idAtendimento: chat.atendimento.id,
                  idColaborador: novoColaboradorId,
                  idLoja,
                },
              });
            }
          });

          this.logger.log(`Chat ${chat.id}: responsável suspenso ${colaboradorSuspenso.id} redistribuído para ${novoColaboradorId}`);
        } else {
          await this.prismaService.atendimentoResponsaveis.delete({
            where: {
              id: responsavelSuspenso.id,
            },
          });

          this.logger.log(`Chat ${chat.id}: responsável suspenso removido, nenhum colaborador disponível para redistribuição`);
        }
      }
    }
  }

  private async processarUsuariosSairamSuspensao(): Promise<void> {
    const agora = new Date();
    const ultimaExecucao = new Date(agora.getTime() - 5 * 60 * 1000); 
    
    const suspensoesExpiradas = await this.prismaService.suspensaoAtendimento.findMany({
      where: {
        endDate: {
          gte: ultimaExecucao,
          lte: agora
        }
      },
      include: {
        usuario: {
          include: {
            colaborador: {
              where: { status: 'ativo' },
              include: {
                cargos: { select: { cargo: true } }
              }
            }
          }
        }
      }
    });

    for (const suspensao of suspensoesExpiradas) {
      const colaborador = suspensao.usuario.colaborador[0];
      if (colaborador) {
        const offsetExistente = await this.suspensaoService.obterOffsetBalanceamento(colaborador.id);
        if (offsetExistente === 0) {
          await this.suspensaoService.definirOffsetBalanceamento(
            colaborador.id,
            colaborador.idLoja,
            colaborador.cargos
          );
          
          this.logger.log(`Offset de balanceamento aplicado para colaborador ${colaborador.id} após expiração de suspensão`);
        }
      }
    }
  }
}