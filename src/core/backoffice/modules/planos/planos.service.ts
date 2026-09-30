import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { CriarPlanoDto } from './dto/criar-plano.dto';
import { EditarPlanoDto } from './dto/editar-plano.dto';
import { ListarPlanosDto } from './dto/listar-planos.dto';
import {
  AppErrorBadRequest,
  AppErrorNotFound,
} from 'src/utils/errors/app-errors';
import Stripe from 'stripe';
import { STATUS_ASSINATURA } from 'src/utils/enum/assinatura.enum';

@Injectable()
export class PlanosService {
  private stripe: Stripe;

  constructor(private readonly prismaService: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-06-30.basil',
    });
  }

  async criarPlano(criarPlanoDto: CriarPlanoDto) {
    const planoExistente = await this.prismaService.plano.findFirst({
      where: { nome: criarPlanoDto.nome },
    });

    if (planoExistente) {
      throw new AppErrorBadRequest('Já existe um plano com este nome');
    }

    const stripeProduct = await this.stripe.products.create({
      name: criarPlanoDto.nome,
      description: criarPlanoDto.descricao,
      metadata: {
        periodo: criarPlanoDto.periodo,
        recursos: JSON.stringify(criarPlanoDto.recursos),
      },
    });

    const stripePrice = await this.stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: Math.round(criarPlanoDto.preco * 100), // centavos
      currency: 'brl',
      recurring: {
        interval:
          criarPlanoDto.periodo === 'mensal'
            ? 'month'
            : criarPlanoDto.periodo === 'anual'
              ? 'year'
              : 'month',
      },
    });

    const novoPlano = await this.prismaService.plano.create({
      data: {
        nome: criarPlanoDto.nome,
        valor: criarPlanoDto.preco,
        descricao: criarPlanoDto.descricao,
        periodo: criarPlanoDto.periodo,
        status: criarPlanoDto.ativo ? 'ativo' : 'inativo',
        recursos: criarPlanoDto.recursos,
        idPrecoStripe: stripePrice.id,
      },
    });

    return {
      message: 'Plano criado com sucesso',
      plano: novoPlano,
    };
  }

  async listarPlanos(listarPlanosDto: ListarPlanosDto) {
    const pagina = parseInt(listarPlanosDto.pagina || '1');
    const itensPorPagina = parseInt(listarPlanosDto.itensPorPagina || '10');
    const skip = (pagina - 1) * itensPorPagina;
  
    const where: any = {
      status: {
        not: STATUS_ASSINATURA.INATIVO
      }
    };
  
    if (listarPlanosDto.pesquisa) {
      where.OR = [
        { nome: { contains: listarPlanosDto.pesquisa, mode: 'insensitive' } },
        {
          descricao: {
            contains: listarPlanosDto.pesquisa,
            mode: 'insensitive',
          },
        },
      ];
    }
  
    if (listarPlanosDto.status && listarPlanosDto.status !== 'todos') {
      where.status = listarPlanosDto.status;
    }
  
    const [planos, total] = await Promise.all([
      this.prismaService.plano.findMany({
        where,
        skip,
        take: itensPorPagina,
        orderBy: { criadoEm: 'desc' },
        include: {
          _count: {
            select: { assinaturas: true },
          },
        },
      }),
      this.prismaService.plano.count({ where }),
    ]);
  
    return {
      planos,
      paginacao: {
        paginaAtual: pagina,
        itensPorPagina,
        totalItens: total,
        totalPaginas: Math.ceil(total / itensPorPagina),
      },
    };
  }

  async buscarPlanoPorId(id: string) {
    const plano = await this.prismaService.plano.findUnique({
      where: { id },
      include: {
        _count: {
          select: { assinaturas: true },
        },
        assinaturas: {
          take: 5,
          orderBy: { criadoEm: 'desc' },
          include: {
            loja: {
              select: {
                nomeEmpresa: true,
                cnpj: true,
              },
            },
          },
        },
      },
    });

    if (!plano) {
      throw new AppErrorNotFound('Plano não encontrado');
    }

    let stripeInfo = null;
    if (plano.idPrecoStripe) {
      try {
        const stripePrice = await this.stripe.prices.retrieve(
          plano.idPrecoStripe,
          {
            expand: ['product'],
          },
        );
        stripeInfo = {
          id: stripePrice.id,
          ativo: stripePrice.active,
          produto: stripePrice.product,
          moeda: stripePrice.currency,
          valor: stripePrice.unit_amount / 100,
        };
      } catch (error) {
        console.error('Erro ao buscar informações do Stripe:', error);
      }
    }

    return {
      ...plano,
      stripeInfo,
    };
  }

  async editarPlano(id: string, editarPlanoDto: EditarPlanoDto) {
    const planoExistente = await this.prismaService.plano.findUnique({
      where: { id },
    });

    if (!planoExistente) {
      throw new AppErrorNotFound('Plano não encontrado');
    }

    if (planoExistente.idPrecoStripe) {
      try {
        const stripePrice = await this.stripe.prices.retrieve(
          planoExistente.idPrecoStripe,
          {
            expand: ['product'],
          },
        );

        if (stripePrice.product && typeof stripePrice.product === 'object') {
          await this.stripe.products.update(stripePrice.product.id, {
            name: editarPlanoDto.nome || planoExistente.nome,
            description: editarPlanoDto.descricao || planoExistente.descricao,
            active: editarPlanoDto.ativo ?? planoExistente.status === 'ativo',
            metadata: {
              periodo: editarPlanoDto.periodo || planoExistente.periodo,
              recursos: JSON.stringify(
                editarPlanoDto.recursos || planoExistente.recursos,
              ),
            },
          });
        }
      } catch (error) {
        console.error('Erro ao atualizar produto no Stripe:', error);
      }
    }

    const planoAtualizado = await this.prismaService.plano.update({
      where: { id },
      data: editarPlanoDto,
    });

    return { message: 'Plano atualizado com sucesso', plano: planoAtualizado };
  }

  async deletarPlano(id: string) {
    const plano = await this.prismaService.plano.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            assinaturas: {
              where: {
                status: STATUS_ASSINATURA.ATIVO,
              },
            },
          },
        },
      },
    });

    if (!plano) {
      throw new AppErrorNotFound('Plano não encontrado');
    }

    if (plano._count.assinaturas > 0) {
      throw new AppErrorBadRequest(
        'Não é possível deletar um plano que possui assinaturas ativas. Desative o plano ao invés de deletá-lo.',
      );
    }

    await this.prismaService.plano.update({
      where: { id },
      data: {
        status: STATUS_ASSINATURA.INATIVO,
      },
    });

    return {
      message: 'Plano deletado com sucesso',
    };
  }

  async sincronizarComStripe() {
    try {
      const stripePrecos = await this.stripe.prices.list({
        active: true,
        expand: ['data.product'],
      });

      const planosStripe = [];

      for (const preco of stripePrecos.data) {
        if (this.isValidProduct(preco.product)) {
          planosStripe.push({
            idPrecoStripe: preco.id,
            nome: preco.product.name,
            valor: preco.unit_amount ? preco.unit_amount / 100 : 0,
            descricao: preco.product.description || null,
          });
        }
      }

      return {
        message: 'Sincronização concluída',
        planosEncontrados: planosStripe.length,
        planos: planosStripe,
      };
    } catch (error) {
      throw new AppErrorBadRequest(
        'Erro ao sincronizar com Stripe: ' + error.message,
      );
    }
  }

  private isValidProduct(product: any): product is Stripe.Product {
    return (
      product &&
      typeof product === 'object' &&
      !product.deleted &&
      'name' in product &&
      'description' in product
    );
  }
}
