import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Novu } from '@novu/node';
import { TypesNotificationEnum } from 'src/utils/enum/notifications.enum';

interface TriggerPushParams {
  subscriberId: string;
  type: TypesNotificationEnum;
  message: string;
  idReference?: string;
}

interface SubscriberParams {
  subscriberId: string;
  email?: string;
  firstName?: string;
  expoPushToken: string;
}

@Injectable()
export class NovuService implements OnModuleInit {
  private novu: Novu;
  private readonly logger = new Logger(NovuService.name);
  private isConfigured = false;

  onModuleInit() {
    const apiKey = process.env.NOVU_API_KEY;
    if (apiKey) {
      this.novu = new Novu(apiKey);
      this.isConfigured = true;
      this.logger.log('Novu SDK initialized');
    } else {
      this.logger.warn(
        'NOVU_API_KEY not configured - push notifications disabled',
      );
    }
  }

  async createOrUpdateSubscriber(params: SubscriberParams): Promise<void> {
    if (!this.isConfigured) return;

    try {
      await this.novu.subscribers.identify(params.subscriberId, {
        email: params.email,
        firstName: params.firstName,
      });

      await this.novu.subscribers.setCredentials(params.subscriberId, 'expo', {
        deviceTokens: [params.expoPushToken],
      });

      this.logger.log(
        `Subscriber ${params.subscriberId} updated with Expo token`,
      );
    } catch (error) {
      this.logger.error(
        `Error creating/updating subscriber: ${error.message}`,
        error.stack,
      );
    }
  }

  async triggerPushNotification(params: TriggerPushParams): Promise<void> {
    if (!this.isConfigured) return;

    try {
      await this.novu.trigger('autopilot-notification', {
        to: {
          subscriberId: params.subscriberId,
        },
        payload: {
          type: params.type,
          message: params.message,
          idReference: params.idReference || '',
        },
      });

      this.logger.log(
        `Push notification triggered for subscriber ${params.subscriberId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error triggering push notification: ${error.message}`,
        error.stack,
      );
    }
  }
}
