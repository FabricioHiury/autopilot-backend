import { Module } from '@nestjs/common';
import { WebhookStripeController } from './webhook-stripe.controller';
import { WebhookStripeService } from './webhook-stripe.service';

@Module({
  controllers: [WebhookStripeController],
  providers: [WebhookStripeService],
})
export class WebhookModule {}
