import {
  HttpException,
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import axios, { AxiosError, AxiosInstance } from 'axios';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import {
  AppErrorBadRequest,
  AppErrorNotFound,
} from 'src/utils/errors/app-errors';
import * as crypto from 'crypto';

import {
  IntegrationFacebook,
  IntegrationInstagram,
  IntegrationOlx,
  IntegrationWpp,
} from './dto/integration.dto';

import {
  ConfigureWhatsAppOfficialDto,
  SetWhatsAppApiTypeDto,
  WhatsAppApiStatusDto,
} from './dto/whatsapp-official.dto';

import {
  ResultMeta,
  ResultOlx,
  ResultWhatsapp,
} from './interface/integrations.interface';

type Channel = 'whatsapp' | 'instagram' | 'facebook' | 'olx' | 'other';

interface IntegrationStatusItem {
  channel: Channel;
  status: string;
  message: string;
}

@Injectable()
export class IntegrationService {
  private readonly logger = new Logger(IntegrationService.name);
  private readonly api: AxiosInstance;
  private readonly pendingWhatsappQrByStore = new Map<string, Promise<any>>();

  constructor(private readonly prisma: PrismaService) {
    const baseURL = process.env.MICROSERVICE_URL || process.env.API_BASE_URL;
    const apiKey = process.env.MICROSERVICE_TOKEN || process.env.API_KEY;

    if (!baseURL) throw new Error('API_BASE_URL not configured.');
    if (!apiKey) throw new Error('API_KEY not configured.');

    this.api = axios.create({
      baseURL,
      timeout: 15000,
      headers: { 'x-micro-token': apiKey },
    });

    this.api.interceptors.response.use(
      (res) => res,
      (err) => Promise.reject(this.normalizeAxiosError(err)),
    );
  }

  private async existsStore(storeId: string): Promise<boolean> {
    if (!storeId) return false;
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true },
    });
    return !!store;
  }

  private async ensureStore(storeId: string): Promise<void> {
    if (!storeId) throw new AppErrorBadRequest('ID of store is required.');
    if (!(await this.existsStore(storeId))) {
      throw new AppErrorNotFound('Store not found');
    }
  }

  private async getLastSyncByChannel(
    storeId: string,
    channel: Channel,
  ): Promise<Date | null> {
    const lastMessage = await this.prisma.message.findFirst({
      where: {
        channel: channel,
        sender: 'CUSTOMER',
        chat: { storeId: storeId },
      },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });
    return lastMessage?.createdAt ?? null;
  }

  private async getReceivedDealsByChannel(
    storeId: string,
    channel: Channel,
  ): Promise<number> {
    return this.prisma.chat.count({
      where: { storeId: storeId, channel: channel },
    });
  }

  private normalizeAxiosError(error: AxiosError | any): HttpException {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status ?? 500;
      const messageFromApi =
        (error.response?.data as any)?.message ||
        (error.response?.data as any)?.error ||
        error.message ||
        'Error in request';

      if (
        typeof messageFromApi === 'string' &&
        messageFromApi.includes(
          'This store has already been saved in the system',
        )
      ) {
        return new HttpException(
          'A store already is integrated this channel.',
          400,
        );
      }

      return new HttpException(messageFromApi, statusCode);
    }
    return new HttpException('Error in request', 500);
  }

  private rethrow(error: any, fallback: string): never {
    if (axios.isAxiosError(error)) {
      throw this.normalizeAxiosError(error);
    }
    throw new HttpException(fallback, 500);
  }

  async clearIntegrationCache(
    storeId: string,
    channel: Channel,
  ): Promise<void> {
    await this.ensureStore(storeId);

    try {
      await this.api.post(`/integrations/${storeId}/${channel}/clear-cache`);
      console.log(
        `Cache cleared for integration ${channel} on store ${storeId}`,
      );
    } catch (error) {
      console.warn(
        `Failed to clear integration cache for ${channel}:${storeId}:`,
        error,
      );
    }
  }

  async clearAllStoreIntegrationCache(storeId: string): Promise<void> {
    await this.ensureStore(storeId);

    try {
      await this.api.post(`/integrations/${storeId}/clear-cache`);
      console.log(`All integration cache cleared for store ${storeId}`);
    } catch (error) {
      console.warn(
        `Failed to clear all integration cache for store ${storeId}:`,
        error,
      );
    }
  }

  async forceRefreshIntegration(
    storeId: string,
    channel: Channel,
  ): Promise<any> {
    await this.ensureStore(storeId);

    try {
      const { data } = await this.api.post(
        `/integrations/${storeId}/${channel}/refresh`,
      );
      console.log(`Integration ${channel} refreshed for store ${storeId}`);
      return data;
    } catch (error) {
      console.error(
        `Failed to refresh integration ${channel} for store ${storeId}:`,
        error,
      );
      this.rethrow(error, `Failed to update integration ${channel}`);
    }
  }

  /**
   * Remove integração with limpeza of cache coordenada
   */
  async removeIntegrationWithCache(
    storeId: string,
    channel: Channel,
  ): Promise<void> {
    await this.ensureStore(storeId);

    try {
      await this.api.delete(`/integrations/${storeId}/${channel}/remove`);
      console.log(`Integration ${channel} removed for store ${storeId}`);
    } catch (error) {
      try {
        await this.clearIntegrationCache(storeId, channel);
      } catch (cacheError) {
        console.warn('Failed to clear cache after remove failure:', cacheError);
      }

      console.error(
        `Failed to remove integration ${channel} for store ${storeId}:`,
        error,
      );
      this.rethrow(error, `Failed to remove integration ${channel}`);
    }
  }

  async checkIntegrationHealth(
    storeId: string,
    channel: Channel,
  ): Promise<any> {
    await this.ensureStore(storeId);

    try {
      return await this.forceRefreshIntegration(storeId, channel);
    } catch (error) {
      console.error(`Health check failed for ${channel}:${storeId}:`, error);
      this.rethrow(error, `Failed to check saúof of integration ${channel}`);
    }
  }

  async getCacheStats(): Promise<any> {
    try {
      const { data } = await this.api.get('/integrations/cache-stats');
      return data;
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
      return { error: 'Unable to retrieve cache stats' };
    }
  }

  async listIntegrations() {
    try {
      const { data } = await this.api.get('/integrations');
      return { integrations: data.data };
    } catch (error) {
      this.rethrow(error, 'Failed to list integrations');
    }
  }

  async listStoreIntegrationStatus(storeId: string) {
    await this.ensureStore(storeId);

    try {
      const { data } = await this.api.get<{ data: IntegrationStatusItem[] }>(
        `/integrations/${storeId}/status`,
      );

      const statusIntegrations = await Promise.all(
        (data.data ?? []).map(async (integration) => {
          const [lastSync, receivedDeals] = await Promise.all([
            this.getLastSyncByChannel(storeId, integration.channel),
            this.getReceivedDealsByChannel(storeId, integration.channel),
          ]);

          return {
            channel: integration.channel,
            status: integration.status,
            message: integration.message,
            lastSync,
            receivedDeals,
          };
        }),
      );

      return { statusIntegrations };
    } catch (error) {
      this.rethrow(error, 'Failed to get status of integrations');
    }
  }

  async integrateWpp(input: IntegrationWpp) {
    await this.ensureStore(input.storeId);

    try {
      const existing = this.pendingWhatsappQrByStore.get(input.storeId);
      if (existing) return await existing;

      const requestPromise = this.api
        .get<ResultWhatsapp>(`/integrations/whatsapp/qrcode/${input.storeId}`)
        .then(({ data }) => data.data)
        .finally(() => this.pendingWhatsappQrByStore.delete(input.storeId));

      this.pendingWhatsappQrByStore.set(input.storeId, requestPromise);
      return await requestPromise;
    } catch (error) {
      await this.clearIntegrationCache(input.storeId, 'whatsapp');
      this.pendingWhatsappQrByStore.delete(input.storeId);
      this.rethrow(error, 'Failed to integrate WhatsApp');
    }
  }

  async integrateOlx(input: IntegrationOlx) {
    await this.ensureStore(input.storeId);

    try {
      await this.clearIntegrationCache(input.storeId, 'olx');

      const payload = {
        storeId: input.storeId,
        clientId: input.clientId,
        clientSecret: input.clientSecret,
      };

      const { data } = await this.api.put<ResultOlx>(
        `/integrations/olx`,
        payload,
      );

      await this.clearIntegrationCache(input.storeId, 'olx');

      return data;
    } catch (error) {
      await this.clearIntegrationCache(input.storeId, 'olx');
      this.rethrow(error, 'Failed to integrate OLX');
    }
  }

  async removeOlx(storeId: string) {
    await this.ensureStore(storeId);

    try {
      await this.api.delete(`/integrations/${storeId}/olx/deactivate`);
      await this.clearIntegrationCache(storeId, 'olx');
      return { ok: true };
    } catch (error) {
      await this.clearIntegrationCache(storeId, 'olx');
      this.rethrow(error, 'Failed to remove integration OLX');
    }
  }

  async removeWhatsApp(storeId: string) {
    await this.ensureStore(storeId);

    try {
      await this.api.delete(`/integrations/${storeId}`);
      await this.clearIntegrationCache(storeId, 'whatsapp');
      this.pendingWhatsappQrByStore.delete(storeId);
      return { ok: true };
    } catch (error) {
      await this.clearIntegrationCache(storeId, 'whatsapp');
      this.pendingWhatsappQrByStore.delete(storeId);
      this.rethrow(error, 'Failed to remove integration WhatsApp');
    }
  }

  async removeWhatsAppIntegration(storeId: string) {
    await this.ensureStore(storeId);

    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: {
        wppApiType: true,
        wppOfficialWabaId: true,
      },
    });

    const isOfficial =
      store?.wppApiType === 'official' || !!store?.wppOfficialWabaId;

    this.logger.log(
      `Removing WhatsApp integration for store ${storeId}, type: ${isOfficial ? 'official' : 'unofficial'}`,
    );

    if (isOfficial) {
      return this.removeWhatsAppOfficial(storeId);
    } else {
      return this.removeWhatsApp(storeId);
    }
  }

  async integrateOlxWebhookAuthentication() {
    try {
      const { data } = await this.api.get('/olx/auth/webhook-authentication');
      return data;
    } catch (error) {
      this.rethrow(error, 'Failed to start webhook of authentication OLX');
    }
  }

  async integrateInstagram(input: IntegrationInstagram) {
    await this.ensureStore(input.storeId);

    try {
      await this.clearIntegrationCache(input.storeId, 'instagram');
      const payload = { storeId: input.storeId };
      const { data } = await this.api.put<ResultMeta>(
        `/integrations/instagram`,
        payload,
      );
      await this.clearIntegrationCache(input.storeId, 'instagram');

      return { url: data.data };
    } catch (error) {
      await this.clearIntegrationCache(input.storeId, 'instagram');
      this.rethrow(error, 'Failed to integrate Instagram');
    }
  }

  async integrateFacebook(input: IntegrationFacebook) {
    await this.ensureStore(input.storeId);

    try {
      await this.clearIntegrationCache(input.storeId, 'facebook');
      const payload = { storeId: input.storeId };
      const { data } = await this.api.put<ResultMeta>(
        `/integrations/facebook`,
        payload,
      );
      await this.clearIntegrationCache(input.storeId, 'facebook');
      return { url: data.data };
    } catch (error) {
      await this.clearIntegrationCache(input.storeId, 'facebook');
      this.rethrow(error, 'Failed to integrate Facebook');
    }
  }

  async configureWhatsAppOfficial(input: ConfigureWhatsAppOfficialDto) {
    await this.ensureStore(input.storeId);

    try {
      const encryptedToken = this.encryptToken(input.accessToken);

      await this.prisma.store.update({
        where: { id: input.storeId },
        data: {
          wppApiType: 'official',
          wppOfficialWabaId: input.wabaId,
          wppOfficialPhoneNumberId: input.phoneNumberId,
          wppOfficialAccessToken: encryptedToken,
          wppOfficialVerifyToken: input.verifyToken,
          wppOfficialPhone: input.businessPhone,
        },
      });

      const response = await this.api.put(`/integrations/whatsapp/official`, {
        storeId: input.storeId,
        wabaId: input.wabaId,
        phoneNumberId: input.phoneNumberId,
        accessToken: input.accessToken,
        verifyToken: input.verifyToken,
        businessPhone: input.businessPhone,
      });

      await this.clearIntegrationCache(input.storeId, 'whatsapp');
      return response.data;
    } catch (error) {
      this.rethrow(error, 'Failed to configure WhatsApp Official');
    }
  }

  async getWhatsAppApiStatus(storeId: string): Promise<WhatsAppApiStatusDto> {
    await this.ensureStore(storeId);

    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: {
        wppApiType: true,
        wppConfigured: true,
        wppInstance: true,
        wppOfficialWabaId: true,
        wppOfficialPhoneNumberId: true,
      },
    });

    if (!store) {
      throw new AppErrorNotFound('Store not found');
    }

    const apiType = (store.wppApiType || 'unofficial') as
      | 'official'
      | 'unofficial';
    const officialConfigured = !!(
      store.wppOfficialWabaId && store.wppOfficialPhoneNumberId
    );
    const unofficialConfigured = !!(store.wppConfigured && store.wppInstance);

    let messageWindow = undefined;
    if (apiType === 'official' && officialConfigured) {
      try {
        const response = await this.api.get(
          `/integrations/whatsapp/${storeId}/api-type`,
        );
        if (response.data.messageWindow) {
          messageWindow = response.data.messageWindow;
        }
      } catch (error) {
        console.error('Failed to get message window status:', error);
      }
    }

    return {
      apiType,
      officialConfigured,
      unofficialConfigured,
      messageWindow,
    };
  }

  async setWhatsAppApiType(storeId: string, input: SetWhatsAppApiTypeDto) {
    await this.ensureStore(storeId);

    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: {
        wppOfficialWabaId: true,
        wppConfigured: true,
      },
    });

    if (!store) {
      throw new AppErrorNotFound('Store not found');
    }

    if (input.apiType === 'official' && !store.wppOfficialWabaId) {
      throw new AppErrorBadRequest('WhatsApp Official not is configured');
    }

    if (input.apiType === 'unofficial' && !store.wppConfigured) {
      throw new AppErrorBadRequest('WhatsApp not official not is configured');
    }

    await this.prisma.store.update({
      where: { id: storeId },
      data: {
        wppApiType: input.apiType,
      },
    });

    await this.clearIntegrationCache(storeId, 'whatsapp');

    return { success: true, apiType: input.apiType };
  }

  async removeWhatsAppOfficial(storeId: string) {
    await this.ensureStore(storeId);

    this.logger.log(`Starting WhatsApp Official removal for store: ${storeId}`);

    try {
      this.logger.log(`Updating local database for store: ${storeId}`);
      await this.prisma.store.update({
        where: { id: storeId },
        data: {
          wppApiType: 'unofficial',
          wppOfficialWabaId: null,
          wppOfficialPhoneNumberId: null,
          wppOfficialAccessToken: null,
          wppOfficialVerifyToken: null,
          wppOfficialPhone: null,
        },
      });

      this.logger.log(
        `Calling micro to delete WhatsApp Official for store: ${storeId}`,
      );
      const microResponse = await this.api.delete(`/integrations/${storeId}`);
      this.logger.log(`Micro response: ${JSON.stringify(microResponse.data)}`);

      await this.clearIntegrationCache(storeId, 'whatsapp');
      this.logger.log(
        `WhatsApp Official removal completed for store: ${storeId}`,
      );

      return { success: true };
    } catch (error: any) {
      this.logger.error(
        `Failed to remove WhatsApp Official for store ${storeId}: ${error?.message}`,
      );
      this.rethrow(error, 'Failed to remove WhatsApp Official');
    }
  }

  async getWhatsAppOfficialPhoneNumbers(wabaId: string, accessToken: string) {
    try {
      if (!wabaId || !accessToken) {
        throw new BadRequestException('WABA ID and Access Token are required');
      }

      const response = await this.api.get(
        `/integrations/whatsapp/official/phone-numbers`,
        {
          params: {
            wabaId,
            accessToken,
          },
        },
      );

      return response;
    } catch (error: any) {
      this.logger.error(
        `Failed to get WhatsApp phone numbers: ${error?.message}`,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to get phone numbers');
    }
  }

  private encryptToken(token: string): string {
    const algorithm = 'aes-256-cbc';
    const keyString =
      process.env.ENCRYPTION_KEY ||
      'I8D7ugiQnWNOOJ6Mb1iDtxYIvZrqDDg3LY/GrB59Qdc=';
    const keyBuffer = crypto.createHash('sha256').update(keyString).digest();
    const key = new Uint8Array(
      keyBuffer.buffer,
      keyBuffer.byteOffset,
      keyBuffer.byteLength,
    );
    const ivBuffer = crypto.randomBytes(16);
    const iv = new Uint8Array(
      ivBuffer.buffer,
      ivBuffer.byteOffset,
      ivBuffer.byteLength,
    );

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return ivBuffer.toString('hex') + ':' + encrypted;
  }

  private decryptToken(encryptedToken: string): string {
    const algorithm = 'aes-256-cbc';
    const keyString =
      process.env.ENCRYPTION_KEY ||
      'I8D7ugiQnWNOOJ6Mb1iDtxYIvZrqDDg3LY/GrB59Qdc=';
    const keyBuffer = crypto.createHash('sha256').update(keyString).digest();
    const key = new Uint8Array(
      keyBuffer.buffer,
      keyBuffer.byteOffset,
      keyBuffer.byteLength,
    );

    const parts = encryptedToken.split(':');
    const ivBuffer = Buffer.from(parts[0], 'hex');
    const iv = new Uint8Array(
      ivBuffer.buffer,
      ivBuffer.byteOffset,
      ivBuffer.byteLength,
    );
    const encrypted = parts[1];

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
