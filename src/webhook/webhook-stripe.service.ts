import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import Stripe from 'stripe';
import {
  STATUS_ASSINATURA,
  STATUS_PAGAMENTO,
} from 'src/utils/enum/assinatura.enum';
import { ExtendedSubscription } from 'src/core/backoffice/modules/assinatura/assinatura.service';
import { uuidv4 } from 'uuidv7';
import axios from 'axios';

interface ExtendedInvoice extends Stripe.Invoice {
  subscription: string;
}

@Injectable()
export class WebhookStripeService {
  private stripe: Stripe;
  private readonly webhookSecret: string;
  private instanciaAxios() {
    return axios.create({
      baseURL: process.env.API_BASE_URL,
      headers: {
        'x-micro-token': process.env.API_KEY,
      },
    });
  }

  constructor(private readonly prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-06-30.basil',
    });
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  }

  async processWebhookEvent(rawBody: Buffer, signature: string) {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret,
      );
    } catch (err) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    const data = event.data.object as any;

    switch (event.type) {
      case 'invoice.payment_succeeded':
        if (data.subscription) {
          console.log(
            'Pagamento bem-sucedido para a assinatura:',
            data.subscription,
          );
          await this.handlePagamentoBemSucedido(data);
        } else {
          console.log('Invoice de pagamento único (não relacionado a assinatura):', data);
        }
        break;

      case 'invoice.payment_failed':
        console.log(
          'Pagamento falhou para a assinatura:',
          data.subscription,
        );
        break;

      case 'customer.subscription.deleted':
        console.log('Assinatura cancelada:', data.id);
        await this.handleAssinaturaCancelada(data.id);
        break;

      default:
        console.log(`Evento não tratado: ${event.type}`);
    }

    return { received: true };
  }

  private async handlePagamentoBemSucedido(invoice: ExtendedInvoice) {
    const idAssinaturaStripe = invoice.subscription as string;

    if (!idAssinaturaStripe) {
      console.error('ID da assinatura não encontrado no invoice:', {
        invoiceId: invoice.id,
        subscription: invoice.subscription,
        customer: invoice.customer
      });
      return;
    }

    try {
      console.log(
        `Processando pagamento bem-sucedido para assinatura: ${idAssinaturaStripe}`,
      );

      const assinatura = await this.buscarAssinatura(idAssinaturaStripe);
      if (!assinatura) {
        console.error(
          `Assinatura do Stripe ${idAssinaturaStripe} não encontrada no banco.`,
        );
        return;
      }

      const stripeSubscription =
        await this.buscarDadosStripe(idAssinaturaStripe);

      const loja = await this.atualizarDadosBanco(
        assinatura,
        stripeSubscription,
        invoice,
      );

      await this.configurarIntegracaoWhatsApp(loja);

      console.log(`Pagamento processado com sucesso para loja ${loja.id}`);
    } catch (error) {
      console.error(
        `Erro ao processar pagamento para assinatura ${idAssinaturaStripe}:`,
        error,
      );
      throw error;
    }
  }

  private async buscarAssinatura(idAssinaturaStripe: string) {
    return await this.prisma.assinatura.findUnique({
      where: { idAssinaturaStripe },
      include: { loja: true },
    });
  }

  private async buscarDadosStripe(idAssinaturaStripe: string) {
    try {
      return (await this.stripe.subscriptions.retrieve(
        idAssinaturaStripe,
      )) as unknown as ExtendedSubscription;
    } catch (error) {
      console.error(
        `Erro ao buscar dados do Stripe para assinatura ${idAssinaturaStripe}:`,
        error,
      );
      throw new Error(
        `Falha ao recuperar dados da assinatura do Stripe: ${error.message}`,
      );
    }
  }

  private async atualizarDadosBanco(
    assinatura: any,
    stripeSubscription: ExtendedSubscription,
    invoice: ExtendedInvoice,
  ) {
    return await this.prisma.$transaction(async (tx) => {
      await tx.assinatura.update({
        where: { id: assinatura.id },
        data: {
          status: STATUS_ASSINATURA.ATIVO,
          dataRenovacao: new Date(stripeSubscription.current_period_end * 1000),
        },
      });

      await tx.historicoPagamento.create({
        data: {
          idAssinatura: assinatura.id,
          status: STATUS_PAGAMENTO.APROVADO,
          valor: invoice.amount_paid / 100,
        },
      });

      const loja = await tx.loja.update({
        where: { id: assinatura.idLoja },
        data: {
          wppConfigurado: true,
          integracoesLiberadas: true,
          wppInstancia: uuidv4(),
        },
      });

      return loja;
    });
  }

  private async configurarIntegracaoWhatsApp(loja: any, maxRetries = 3) {
    let tentativa = 1;

    while (tentativa <= maxRetries) {
      try {
        console.log(
          `Configurando integração WhatsApp para loja ${loja.id} (tentativa ${tentativa}/${maxRetries})`,
        );

        const response = await this.instanciaAxios().put(
          `/integrations/whatsapp`,
          {
            instanceId: loja.wppInstancia,
            storeId: String(loja.id),
          },
        );

        console.log(
          `Integração WhatsApp configurada com sucesso para loja ${loja.id}`,
        );
        return response.data;
      } catch (error) {
        console.error(
          `Erro na tentativa ${tentativa} de configurar WhatsApp para loja ${loja.id}:`,
          error.message,
        );

        if (tentativa === maxRetries) {
          await this.handleIntegracaoWhatsAppFalhou(loja, error);
          throw new Error(
            `Falha ao configurar integração WhatsApp após ${maxRetries} tentativas: ${error.message}`,
          );
        }

        const delayMs = Math.pow(2, tentativa - 1) * 1000; // 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        tentativa++;
      }
    }
  }

  private async handleIntegracaoWhatsAppFalhou(loja: any, error: any) {
    console.error(
      `Falha crítica na integração WhatsApp para loja ${loja.id}`,
    );
  }

  private async handleAssinaturaCancelada(idAssinaturaStripe: string) {
    const dataFimCarencia = new Date();
    dataFimCarencia.setDate(dataFimCarencia.getDate() + 7);
    await this.prisma.assinatura.update({
      where: { idAssinaturaStripe },
      data: {
        status: STATUS_ASSINATURA.INATIVO,
        dataCancelamento: new Date(),
        dataFimCarencia: dataFimCarencia,
        dataRenovacao: null,
      },
    });
  }
}
