import { Controller, Post, Headers, Req } from '@nestjs/common';
import { Request } from 'express';
import { WebhookStripeService } from './webhook-stripe.service';

@Controller('webhook/stripe')
export class WebhookStripeController {
  constructor(private readonly webhookStripeService: WebhookStripeService) {}

  @Post()
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: Request,
  ) {
    const rawBody = request.body as Buffer
    return this.webhookStripeService.processWebhookEvent(rawBody, signature);
  }
}