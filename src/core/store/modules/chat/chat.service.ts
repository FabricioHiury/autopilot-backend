import { EventEmitter2 } from '@nestjs/event-emitter';
import { HttpException, Injectable, Inject } from '@nestjs/common';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { IncomingMessageDto, SendMessageDto } from './dto/message.dto';
import { ReturnSendMessage } from './interfaces/message.interface';
import { Prisma } from '@prisma/client';
import {
  AppErrorBadRequest,
  AppErrorNotFound,
} from 'src/utils/errors/app-errors';
import { IntegrationsEnum, Sender } from './enum/channel.enum';
import { FiltersRoutesListing } from './dto/filters.dto';
import { getStringUrlAvatar } from 'src/utils/avatarUtils';
import { FileService } from 'src/persistence/files/file/file.service';
import * as mime from 'mime-types';
import { Readable } from 'stream';
import { AvatarExternalService } from '../avatar-external/avatar-external.service';
import { ENUM_TYPE_AVATAR_EXTERNAL } from '../avatar-external/enum/type-avatar-external.enum';
import { normalizePhone } from 'src/utils/phone';
import { DistributionAutomaticService } from '../deal/modules/distribution-automatic/distribution-automatic.service';
import { AxiosError, AxiosInstance } from 'axios';
import {
  downloadFileContentSafe,
  isBase64Content,
  processBase64Content,
  extractMimeTypeFromUrl,
  generateContentHash,
} from './file-download.utils';
import { STATUS_DEAL, TEMPERATURE_DEAL } from 'src/utils/enum/deal.enum';
import { MailService } from 'src/utils/mail/mail.service';
import { NotificationsService } from 'src/core/notifications/notifications.service';
import { OlxReceiveLeadDto } from './dto/receive-lead.dto';
import { TypesNotificationEnum } from 'src/utils/enum/notifications.enum';

export const AVATAR_INTERNAL_HOST = 'autopilot.firebasestorage.app';

export const DUP_WINDOWS = {
  WHATSAPP_RECENT_MS: 2 * 60_000,
  WHATSAPP_TEXT_MS: 5 * 60_000,
  SAME_ID_MS: 30_000,
};

const URL_MICROSERVICE = {
  MESSAGE: '/communication/messages',
};
@Injectable()
export class ChatService {
  private readonly GRACE_PERIOD_DAYS = 1;
  private readonly dealCheckCache = new Map<
    string,
    { lastCheck: Date; hasFinalized: boolean }
  >();
  private readonly CACHE_TTL_HOURS = 12; // 12 hours
  private readonly activeChatCache = new Map<
    string,
    { chatId: string; lastAccess: Date }
  >();
  private readonly ACTIVE_CHAT_CACHE_TTL = 30 * 60 * 1000; // 30 min

  constructor(
    private readonly prisma: PrismaService,
    private readonly fileService: FileService,
    private readonly avatarExternalService: AvatarExternalService,
    @Inject('API_HTTP') private readonly apiHttp: AxiosInstance,
    private readonly distService: DistributionAutomaticService,
    private readonly mailService: MailService,
    private readonly notificationsService: NotificationsService,
    private readonly events: EventEmitter2,
  ) {}

  private oneFileOrThrow(files?: Express.Multer.File[] | null) {
    if (!files?.length) throw new AppErrorBadRequest('A file is required.');
    if (files.length > 1)
      throw new AppErrorBadRequest('Upload exactly one file.');
    return files[0];
  }

  private async getStoreOr404(storeId: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });
    if (!store) throw new AppErrorNotFound('Store not found.');
    return store;
  }

  private async getChatOr404(chatId: string, storeId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId, storeId },
    });
    if (!chat) throw new AppErrorNotFound('Chat not found.');
    return chat;
  }

  private async getChatLite(chatId: string) {
    return this.prisma.chat.findUnique({
      where: { id: chatId },
      select: {
        id: true,
        channel: true,
        storeId: true,
        dealId: true,
        store: {
          select: { id: true, storeOwner: { select: { userId: true } } },
        },
        customer: { select: { id: true, avatarUrl: true } },
        temporaryCustomer: { select: { id: true, avatar: true } },
      },
    });
  }

  private async getUserNameANDAvatar(userId?: string, storeId?: string) {
    if (userId) {
      const u = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true },
      });
      return {
        name: u?.name ?? null,
        avatar: u ? getStringUrlAvatar(u.id) : null,
      };
    }
    if (storeId) {
      const l = await this.prisma.store.findUnique({
        where: { id: storeId },
        select: {
          storeOwner: {
            select: { user: { select: { id: true, name: true } } },
          },
        },
      });
      const uid = l?.storeOwner?.user?.id;
      return {
        name: l?.storeOwner?.user?.name ?? null,
        avatar: uid ? getStringUrlAvatar(uid) : null,
      };
    }
    return { name: null, avatar: null };
  }

  private includeNamePrefix(
    name?: string | null,
    channel?: IntegrationsEnum | string,
  ) {
    const allow: IntegrationsEnum[] = [
      IntegrationsEnum.INSTAGRAM,
      IntegrationsEnum.WHATSAPP,
      IntegrationsEnum.FACEBOOK,
    ];
    return name && channel && allow.includes(channel as IntegrationsEnum)
      ? `*${name}*:\n`
      : '';
  }

  private onlyExternalId(v?: string | null) {
    if (!v) return '';
    const m = String(v).match(/([A-F0-9]{20,})$/i);
    return m ? m[1] : String(v);
  }

  private stripNamePrefix(text?: string | null) {
    return (text ?? '').replace(/^\*[^*]+\*:\s*\n/, '').trim();
  }

  private inferMessageTypeFromMimeType(
    mimeType?: string | null,
  ): string | null {
    if (!mimeType) return null;
    const lower = mimeType.toLowerCase();
    if (lower.startsWith('image/')) return 'image';
    if (lower.startsWith('audio/')) return 'audio';
    if (lower.startsWith('video/')) return 'video';
    if (lower === 'application/pdf') return 'document';
    return null;
  }

  private asUpper(v?: string | null, fallback = 'NOT PROVIDED') {
    return (v ?? fallback).toUpperCase();
  }

  private async findActiveChatByContact(params: {
    storeId: string;
    channel: string;
    externalRecipientId: string;
  }): Promise<any | null> {
    const { storeId, channel, externalRecipientId } = params;

    const normalizeRecipient =
      channel === 'whatsapp'
        ? normalizePhone(externalRecipientId)
        : externalRecipientId;

    const cacheKey = `${storeId}-${channel}-${normalizeRecipient}`;

    const cached = this.activeChatCache.get(cacheKey);
    if (
      cached &&
      Date.now() - cached.lastAccess.getTime() < this.ACTIVE_CHAT_CACHE_TTL
    ) {
      const chat = await this.prisma.chat.findUnique({
        where: { id: cached.chatId },
        select: {
          id: true,
          dealId: true,
          createdAt: true,
          archived: true,
          deal: {
            select: {
              status: true,
              updatedAt: true,
            },
          },
        },
      });

      if (chat && this.isChatActive(chat)) {
        cached.lastAccess = new Date();
        return chat;
      } else {
        this.activeChatCache.delete(cacheKey);
      }
    }

    const chat = await this.prisma.chat.findFirst({
      where: {
        storeId,
        channel,
        externalRecipientId: normalizeRecipient,
        OR: [
          {
            deal: {
              status: {
                notIn: [STATUS_DEAL.SUCCESS, STATUS_DEAL.LOST],
              },
            },
          },
          {
            dealId: null,
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        ],
      },
      include: {
        customer: {
          select: { id: true, name: true, avatarUrl: true },
        },
        temporaryCustomer: {
          select: { id: true, name: true, avatar: true },
        },
        deal: {
          select: {
            id: true,
            status: true,
            updatedAt: true,
          },
        },
      },
      orderBy: [
        { dealId: { sort: 'desc', nulls: 'last' } },
        { createdAt: 'desc' },
      ],
      take: 1,
    });

    if (chat && this.isChatActive(chat)) {
      this.activeChatCache.set(cacheKey, {
        chatId: chat.id,
        lastAccess: new Date(),
      });
      return chat;
    }

    return null;
  }

  private isChatActive(chat: any): boolean {
    if (!chat.deal) {
      const hoursSinceCreation =
        (Date.now() - new Date(chat.createdAt).getTime()) / (1000 * 60 * 60);
      return hoursSinceCreation <= 24; // 24h
    }

    const status = chat.deal.status as STATUS_DEAL;
    return !this.isDealFinalized(status);
  }

  private invalidateChatCache(
    storeId: string,
    channel: string,
    recipient: string,
  ): void {
    const cacheKey = `${storeId}-${channel}-${recipient}`;
    this.activeChatCache.delete(cacheKey);
  }

  private buildMulterLikeFile(
    fileBuffer: Buffer,
    mimeType: string,
    baseName: string,
  ): Express.Multer.File {
    const ext = mime.extension(mimeType) || 'bin';
    return {
      fieldname: 'file',
      originalname: `${baseName}.${ext}`,
      encoding: '7bit',
      mimetype: mimeType,
      size: fileBuffer.length,
      destination: '',
      filename: '',
      path: '',
      buffer: fileBuffer,
      stream: Readable.from(fileBuffer),
    };
  }

  private async findExistingAttachment(hash: string, userId: string) {
    try {
      const existing = await this.prisma.$queryRaw<
        Array<{ id: string; url: string; type: string | null }>
      >`
        SELECT a.id, a.url, a.type
        FROM files a
        JOIN attachment_hash ah ON ah.file_id = a.id
        WHERE ah.hash = ${hash} AND a.user_id = ${userId}
        AND a.entity LIKE 'chat%'
        LIMIT 1
      `;
      return existing[0] || null;
    } catch {
      return null;
    }
  }

  private async saveAttachmentHash(
    hash: string,
    fileId: string | null,
    userId: string,
  ) {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO attachment_hash (hash, file_id, user_id, created_at)
        VALUES (${hash}, ${fileId}, ${userId}, NOW())
        ON CONFLICT (hash, user_id)
        DO UPDATE SET file_id = EXCLUDED.file_id
      `;
    } catch {
      /* noop */
    }
  }

  private async replaceFileChat(params: {
    src: string;
    chatId: string;
  }): Promise<{ src: string; mimetype: string }> {
    try {
      const src = params.src;
      if (!src) return { src: '', mimetype: 'application/octet-stream' };

      if (
        src.includes('firebasestorage.googleapis.com') ||
        src.includes('storage.googleapis.com')
      ) {
        return {
          src,
          mimetype: extractMimeTypeFromUrl(src) || 'application/octet-stream',
        };
      }

      const [chat, hash] = await Promise.all([
        this.getChatLite(params.chatId),
        generateContentHash(src),
      ]);

      if (!chat) throw new Error(`Chat ${params.chatId} not found`);

      const userId = chat.store.storeOwner.userId;
      const existing = await this.findExistingAttachment(hash, userId);
      if (existing) {
        return {
          src: existing.url,
          mimetype: existing.type || 'application/octet-stream',
        };
      }

      let fileBuffer: Buffer, mimeType: string;
      if (isBase64Content(src)) {
        ({ fileBuffer, mimeType } = processBase64Content(src));
      } else {
        ({ fileBuffer, mimeType } = await downloadFileContentSafe(src));
      }

      const file = this.buildMulterLikeFile(fileBuffer, mimeType, 'file');
      const [saved] = await Promise.all([
        this.fileService.saveFile({
          file: file,
          entity: 'chat-attachment',
          userId: userId,
          entityId: params.chatId,
        }),
        this.saveAttachmentHash(hash, '', userId),
      ]);

      this.saveAttachmentHash(hash, saved.id, userId).catch(() => {});
      return { src: saved.url, mimetype: mimeType };
    } catch {
      return { src: params.src, mimetype: 'application/octet-stream' };
    }
  }

  private async replaceFileAvatar(params: {
    src: string;
    chatId: string;
  }): Promise<string> {
    try {
      const src = params.src;
      if (!src || src.includes(AVATAR_INTERNAL_HOST)) return src;

      const chat = await this.prisma.chat.findUnique({
        where: { id: params.chatId },
        include: { store: true, temporaryCustomer: true, customer: true },
      });
      if (!chat) throw new Error(`Chat ${params.chatId} not found`);

      const isUrl = src.startsWith('http://') || src.startsWith('https://');
      const isB64 = isBase64Content(src);

      let fileBuffer: Buffer, mimeType: string;
      if (isB64) {
        if (src.startsWith('data:image')) {
          const [meta, data] = src.split(',');
          mimeType = meta.match(/:(.*?);/)?.[1] || 'image/jpeg';
          fileBuffer = Buffer.from(data, 'base64');
        } else {
          mimeType = 'image/jpeg';
          fileBuffer = Buffer.from(src, 'base64');
        }
      } else if (isUrl) {
        const dl = await downloadFileContentSafe(src);
        fileBuffer = dl.fileBuffer;
        mimeType = dl.mimeType;
      } else {
        return src;
      }

      const file = this.buildMulterLikeFile(fileBuffer, mimeType, 'avatar');
      const type: ENUM_TYPE_AVATAR_EXTERNAL = chat.customer
        ? ENUM_TYPE_AVATAR_EXTERNAL.CUSTOMER
        : ENUM_TYPE_AVATAR_EXTERNAL.CUSTOMER_TEMP;
      const id = chat.customer ? chat.customer.id : chat.temporaryCustomer.id;

      await this.avatarExternalService.saveAvatar({
        files: [file],
        storeId: chat.store.id,
        type,
        id,
      });
      return this.avatarExternalService.getUrlAvatar({
        storeId: chat.store.id,
        type,
        id,
      });
    } catch {
      return params.src;
    }
  }

  private async upsertAvatarFirebaseIfNeeded(
    chatId: string,
    rawUrl?: string,
  ): Promise<string | null> {
    if (!rawUrl || rawUrl.includes(AVATAR_INTERNAL_HOST)) return rawUrl ?? null;

    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      select: {
        customer: { select: { id: true, avatarUrl: true } },
        temporaryCustomer: { select: { id: true, avatar: true } },
      },
    });
    if (!chat) return rawUrl ?? null;

    const current =
      chat.customer?.avatarUrl ?? chat.temporaryCustomer?.avatar ?? null;
    if (current?.includes(AVATAR_INTERNAL_HOST)) return current;

    const processed = await this.replaceFileAvatar({ src: rawUrl, chatId });
    if (!processed || processed === rawUrl) return rawUrl;

    if (chat.customer) {
      await this.prisma.customer.update({
        where: { id: chat.customer.id },
        data: { avatarUrl: processed },
      });
    } else if (chat.temporaryCustomer) {
      await this.prisma.temporaryCustomer.update({
        where: { id: chat.temporaryCustomer.id },
        data: { avatar: processed },
      });
    }
    return processed;
  }

  async getChat(chatId: string, storeId: string) {
    return this.prisma.chat.findUnique({
      where: { id: chatId, storeId },
      include: { customer: true, temporaryCustomer: true },
    });
  }

  async newChat(params: {
    storeId: string;
    userId: string;
    message: SendMessageDto;
    typeCustomer: 'customer' | 'temporary';
    customerId?: string;
    name?: string;
    mobile?: string;
  }): Promise<{ chatId: string }> {
    const { storeId, userId, message, typeCustomer, customerId, mobile } =
      params;
    const channel = message.channel;

    if (typeCustomer === 'customer' && !customerId) {
      throw new AppErrorBadRequest(
        'customerId invalid for typeCustomer=customer',
      );
    }

    const recipientFmt = normalizePhone(
      channel === 'whatsapp' ? mobile || message.recipient : message.recipient,
    );

    const chatExisting = await this.findActiveChatByContact({
      storeId,
      channel,
      externalRecipientId: recipientFmt,
    });

    if (chatExisting) {
      await this.updateChatInfoIfNeeded(chatExisting, {
        customerId: typeCustomer === 'customer' ? customerId : undefined,
        name: params.name,
        sentByStore: true,
      });

      await this.sendMessage(chatExisting.id, storeId, userId, {
        ...message,
        recipient: recipientFmt,
      });
      return { chatId: chatExisting.id };
    }

    const chat = await this.prisma.$transaction(async (tx) => {
      let temporaryCustomerId: string | null = null;
      if (typeCustomer === 'temporary') {
        const whatsapp = normalizePhone(mobile || '');
        const temp = await tx.temporaryCustomer.create({
          data: {
            storeId,
            channel,
            name: params.name,
            whatsapp,
            externalContactId: recipientFmt,
          },
          select: { id: true },
        });
        temporaryCustomerId = temp.id;
      }

      const newChat = await tx.chat.create({
        data: {
          storeId,
          channel,
          customerId: typeCustomer === 'customer' ? customerId! : null,
          temporaryCustomerId,
          externalRecipientId: recipientFmt,
        },
        select: { id: true },
      });

      const cacheKey = `${storeId}-${channel}-${recipientFmt}`;
      this.activeChatCache.set(cacheKey, {
        chatId: newChat.id,
        lastAccess: new Date(),
      });

      return newChat;
    });

    this.invalidateChatCache(storeId, channel, recipientFmt);

    await this.sendMessage(chat.id, storeId, userId, {
      ...message,
      recipient: recipientFmt,
    });
    return { chatId: chat.id };
  }

  async generateAttachment(
    files: Express.Multer.File[],
    chatId: string,
    storeId: string,
  ) {
    await this.getChatOr404(chatId, storeId);
    const file = this.oneFileOrThrow(files);
    const chat = await this.getChatLite(chatId);
    if (!chat) throw new AppErrorBadRequest(`Chat of ID ${chatId} not found`);

    const userId = chat.store.storeOwner.userId;
    const saved = await this.fileService.saveFile({
      file: file,
      entity: 'chat-attachment-upload',
      userId: userId,
      entityId: chatId,
    });

    return { src: saved.url, mimetype: file.mimetype };
  }

  async sendMessage(
    chatId: string,
    storeId: string,
    userId: string,
    dto: SendMessageDto,
  ) {
    if (!dto.text && !dto.attachmentUrl && !dto.type)
      throw new AppErrorBadRequest('Message content is required');
    if (!chatId || !storeId || !userId)
      throw new AppErrorBadRequest('Parameters invalid.');

    const [chat, user, store] = await Promise.all([
      this.prisma.chat.findUnique({
        where: { id: chatId, storeId: storeId },
        select: {
          id: true,
          channel: true,
          storeId: true,
          externalRecipientId: true,
        },
      }),

      this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true },
      }),

      this.prisma.store.findUnique({
        where: { id: storeId },
        select: { wppApiType: true },
      }),
    ]);

    if (!chat) throw new AppErrorNotFound('Chat not found.');
    if (!user) throw new AppErrorNotFound('User not found.');
    if (
      dto.channel !== chat.channel ||
      dto.recipient !== chat.externalRecipientId
    )
      throw new AppErrorBadRequest('Recipient and channel must match the chat');

    const dataUser = {
      name: user?.name ?? 'User not identified',
      avatar: getStringUrlAvatar(user.id),
      typePerson: Sender.STORE as const,
      userId: userId,
    };

    const prefix = this.includeNamePrefix(dataUser.name, chat.channel);
    const {
      latitude,
      longitude,
      text: rawMessage,
      recipient,
      quotedMessageId,
      ...rest
    } = dto;

    const lat = validateLat(latitude);
    const lng = validateLng(longitude);

    const inferredType = dto.attachmentUrl
      ? this.inferMessageTypeFromMimeType(dto.attachmentType)
      : null;

    const localMsg = await this.saveMessageOptimized(
      chatId,
      {
        ...dto,
        message: dto.text,
        storeId: storeId,
        externalRecipientId: recipient,
        quotedMessageId,
        timestamp: new Date(),
        type: inferredType,
      } as any,
      dataUser,
    );

    if (!localMsg)
      throw new HttpException('Failed to persist local message.', 500);

    try {
      const isReaction = dto.type === 'reaction';
      const isWhatsApp = chat.channel === IntegrationsEnum.WHATSAPP;
      const wppApiType =
        isWhatsApp && store?.wppApiType ? store.wppApiType : undefined;

      const payload = {
        storeId,
        latitude: lat,
        longitude: lng,
        recipient,
        messageId: localMsg.id,
        text: rawMessage
          ? isReaction
            ? rawMessage
            : `${prefix}${rawMessage}`
          : undefined,
        quotedMessageId,
        wppApiType,
        channel: chat.channel,
        attachmentUrl: dto.attachmentUrl,
        attachmentType: dto.attachmentType,
        type: dto.type,
        locationName: dto.locationName,
        locationAddress: dto.locationAddress,
        locationUrl: dto.locationUrl,
      };

      const resp = await this.apiHttp.post<ReturnSendMessage>(
        URL_MICROSERVICE.MESSAGE,
        payload,
        { timeout: 10000 },
      );

      if (resp.status >= 400) {
        const msg =
          (resp.data as any)?.message ||
          (resp.data as any)?.response ||
          'Send failed';
        throw new HttpException(msg, resp.status);
      }

      const { data, message } = resp.data as ReturnSendMessage;

      const externalId: string | undefined =
        data?.response || (resp.data as any).externalMessageId;

      if (externalId) {
        await this.prisma.message.update({
          where: { id: localMsg.id },
          data: { externalMessageId: externalId, deliveryStatus: 'SENT' },
        });

        localMsg.externalMessageId = externalId;
      }

      this.events.emit('chat.message.received', {
        storeId,
        chatId,
        message: localMsg,
      });
      return { data: message, messageSent: localMsg };
    } catch (error: unknown) {
      await this.prisma.message.updateMany({
        where: { id: localMsg.id, deliveryStatus: 'PENDING' },
        data: { deliveryStatus: 'FAILED' },
      });
      const err = error as AxiosError;
      const status = err.response?.status ?? 500;
      const msg =
        (err.response?.data as any)?.message ??
        err.message ??
        'Message sending error';
      throw new HttpException(msg, status);
    }
  }

  private chatLocks = new Map<string, Promise<any>>();

  private async manageChat(params: IncomingMessageDto) {
    const CUSTOMER_UNKNOWN = 'Unknown';
    const number =
      params.channel === IntegrationsEnum.WHATSAPP
        ? normalizePhone(params.externalRecipientId)
        : params.externalRecipientId;
    const lockKey = `${params.storeId}-${params.channel}-${number}`;

    if (this.chatLocks.has(lockKey)) {
      try {
        return await this.chatLocks.get(lockKey);
      } catch {
        /* segue */
      }
    }

    const lock = (async () => {
      try {
        let chat = await this.findActiveChatByContact({
          storeId: params.storeId,
          channel: params.channel,
          externalRecipientId: number,
        });

        if (chat) {
          await this.updateChatInfoIfNeeded(chat, {
            metadata: params.metadata,
            sentByStore: params.sentByStore,
          });
        } else {
          chat = await this.prisma.$transaction(async (tx) => {
            const existing = await tx.chat.findFirst({
              where: {
                storeId: params.storeId,
                externalRecipientId: number,
                channel: params.channel,
              },
              include: {
                temporaryCustomer: {
                  select: {
                    id: true,
                    name: true,
                    avatar: true,
                  },
                },
              },
            });
            if (existing) return existing;

            const name = params.sentByStore
              ? CUSTOMER_UNKNOWN
              : (params.metadata?.name ?? CUSTOMER_UNKNOWN);
            const avatar = params.sentByStore
              ? ''
              : (params.metadata?.avatarUrl ?? '');

            const temp = await tx.temporaryCustomer.create({
              data: {
                storeId: params.storeId,
                name,
                avatar,
                whatsapp: params.metadata?.mobile,
                email: params.metadata?.email,
                channel: params.channel,
                externalContactId: params.externalRecipientId,
              },
              select: { id: true },
            });

            return tx.chat.create({
              data: {
                storeId: params.storeId,
                externalRecipientId: number,
                channel: params.channel,
                temporaryCustomerId: temp.id,
                externalAdId: params.metadata?.externalAdId ?? null,
              },
              include: {
                temporaryCustomer: {
                  select: { id: true, name: true, avatar: true },
                },
              },
            });
          });

          await this.updateChatInfoIfNeeded(chat, {
            metadata: params.metadata,
            sentByStore: params.sentByStore,
          });

          return chat;
        }

        if (chat) {
          this.activeChatCache.set(lockKey, {
            chatId: chat.id,
            lastAccess: new Date(),
          });
        }

        return chat;
      } finally {
        setTimeout(() => this.chatLocks.delete(lockKey), 1000);
      }
    })();

    this.chatLocks.set(lockKey, lock);
    return lock;
  }

  private async updateChatInfoIfNeeded(
    chat: any,
    params: {
      customerId?: string;
      name?: string;
      metadata?: any;
      sentByStore?: boolean;
    },
  ): Promise<void> {
    const updates: any = {};
    const customerTemporaryUpdates: any = {};

    if (!chat.customerId && params.customerId) {
      updates.customerId = params.customerId;
    }

    if (chat.temporaryCustomer && !params.sentByStore) {
      const nameCurrent = chat.temporaryCustomer.name;
      const nameEmpty =
        !nameCurrent || nameCurrent.trim() === '' || nameCurrent === 'Unknown';

      const newName = params.name || params.metadata?.name;
      if (
        nameEmpty &&
        newName &&
        newName.trim() !== '' &&
        newName !== 'Unknown'
      ) {
        customerTemporaryUpdates.name = newName;
      }

      const avatarCurrent = chat.temporaryCustomer.avatar;
      const avatarEmpty = !avatarCurrent || avatarCurrent.trim() === '';
      const newAvatar = params.metadata?.avatarUrl;

      if (avatarEmpty && newAvatar && newAvatar.trim() !== '') {
        customerTemporaryUpdates.avatar = newAvatar;
      }
    }

    const promises = [];

    if (Object.keys(updates).length > 0) {
      promises.push(
        this.prisma.chat.update({
          where: { id: chat.id },
          data: updates,
        }),
      );
    }

    if (
      Object.keys(customerTemporaryUpdates).length > 0 &&
      chat.temporaryCustomer
    ) {
      promises.push(
        this.prisma.temporaryCustomer.update({
          where: { id: chat.temporaryCustomer.id },
          data: customerTemporaryUpdates,
        }),
      );
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }

  private async saveMessage(
    chatId: string,
    params: IncomingMessageDto,
    person: {
      name?: string;
      avatar?: string;
      userId?: string;
      typePerson: Sender;
    },
  ) {
    const isReaction = params.type === 'reaction';

    if (isReaction && params.quotedMessageId) {
      return await this.prisma.$transaction(async (tx) => {
        const originalMessage = await tx.message.findFirst({
          where: {
            chatId: chatId,
            externalMessageId: params.quotedMessageId,
          },
        });

        if (originalMessage) {
          const updated = await tx.message.update({
            where: { id: originalMessage.id },
            data: { reaction: params.message },
          });

          await tx.chat.update({
            where: { id: chatId },
            data: { updatedAt: new Date() },
          });

          return updated;
        }

        return null;
      });
    }

    let attachmentType: string | null = null;

    if (params.attachmentUrl) {
      const attachment = await this.replaceFileChat({
        src: params.attachmentUrl,
        chatId,
      });
      params.attachmentUrl = attachment.src;
      attachmentType = attachment.mimetype;
    }

    if (
      person.typePerson === Sender.STORE &&
      (!person.name || !person.avatar)
    ) {
      const who = await this.getUserNameANDAvatar(
        person.userId,
        params.storeId,
      );
      person.name = who.name;
      person.avatar = who.avatar;
    }

    let avatarPerson = person.avatar ?? null;
    if (person.typePerson === Sender.CUSTOMER && params.metadata?.avatarUrl) {
      avatarPerson = await this.upsertAvatarFirebaseIfNeeded(
        chatId,
        params.metadata.avatarUrl,
      );
    }

    const markIsRead = person.typePerson !== Sender.CUSTOMER;

    const msg = await this.prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          chatId: chatId,
          content: params.message,
          attachmentUrl: params.attachmentUrl,
          attachmentType,
          type: params.type ?? null,
          externalMessageId: params.messageId,
          channel: params.channel,
          externalRecipientId: params.externalRecipientId,
          sender: person.typePerson,
          isRead: markIsRead,
          originInstagram:
            params.channel === IntegrationsEnum.INSTAGRAM
              ? params.originInstagram
              : null,
          ...(params.timestamp
            ? { createdAt: new Date(params.timestamp as any) }
            : {}),
          ...(params.metadata ? { metadata: params.metadata as any } : {}),
          person: {
            create: {
              name: person.name ?? 'User not identified',
              avatar: avatarPerson,
            },
          },
          ...(params.quotedMessageId
            ? ({ quotedMessageId: params.quotedMessageId } as any)
            : {}),
        },
      });

      const chatUpdateData: any = { updatedAt: new Date() };
      if (person.typePerson === Sender.CUSTOMER) {
        chatUpdateData.lastMessageCustomerAt = params.timestamp
          ? new Date(params.timestamp as any)
          : new Date();
      }
      await tx.chat.update({ where: { id: chatId }, data: chatUpdateData });

      if (avatarPerson && person.typePerson === Sender.CUSTOMER) {
        const c = await tx.chat.findUnique({
          where: { id: chatId },
          select: {
            customer: { select: { id: true, avatarUrl: true } },
            temporaryCustomer: { select: { id: true, avatar: true } },
          },
        });

        if (c?.customer) {
          if ((c.customer.avatarUrl ?? '') !== avatarPerson) {
            await tx.customer.update({
              where: { id: c.customer.id },
              data: { avatarUrl: avatarPerson },
            });
          }
        } else if (c?.temporaryCustomer) {
          const current = c.temporaryCustomer.avatar ?? '';
          const internal = current.includes(AVATAR_INTERNAL_HOST);
          if (!current || !internal) {
            await tx.temporaryCustomer.update({
              where: { id: c.temporaryCustomer.id },
              data: { avatar: avatarPerson },
            });
          }
        }
      }

      return created;
    });

    return msg;
  }

  private async saveMessageOptimized(
    chatId: string,
    params: IncomingMessageDto,
    person: {
      name: string;
      avatar: string | null;
      userId: string;
      typePerson: Sender;
    },
  ) {
    let attachmentType: string | null = null;

    if (params.attachmentUrl) {
      if (
        params.attachmentUrl.includes('firebasestorage.googleapis.com') ||
        params.attachmentUrl.includes('storage.googleapis.com')
      ) {
        attachmentType =
          extractMimeTypeFromUrl(params.attachmentUrl) ||
          'application/octet-stream';
      } else {
        const attachment = await this.replaceFileChat({
          src: params.attachmentUrl,
          chatId,
        });
        params.attachmentUrl = attachment.src;
        attachmentType = attachment.mimetype;
      }
    }

    const markIsRead = person.typePerson !== Sender.CUSTOMER;

    const msg = await this.prisma.$transaction(async (tx) => {
      const chatUpdateData: any = { updatedAt: new Date() };
      if (person.typePerson === Sender.CUSTOMER) {
        chatUpdateData.lastMessageCustomerAt = params.timestamp
          ? new Date(params.timestamp as any)
          : new Date();
      }

      const [created] = await Promise.all([
        tx.message.create({
          data: {
            chatId: chatId,
            content: params.message,
            attachmentUrl: params.attachmentUrl,
            attachmentType,
            type: params.type ?? null,
            externalMessageId: params.messageId,
            channel: params.channel,
            externalRecipientId: params.externalRecipientId,
            sender: person.typePerson,
            isRead: markIsRead,
            userId: person.userId,
            ...(params.timestamp
              ? { createdAt: new Date(params.timestamp as any) }
              : {}),
            ...(params.metadata ? { metadata: params.metadata as any } : {}),
            person: {
              create: { name: person.name, avatar: person.avatar },
            },
            ...(params.quotedMessageId
              ? ({ quotedMessageId: params.quotedMessageId } as any)
              : {}),
          },
        }),
        tx.chat.update({ where: { id: chatId }, data: chatUpdateData }),
      ]);

      return created;
    });

    return msg;
  }

  async findMessagesChat(
    storeId: string,
    chatId: string,
    params: FiltersRoutesListing,
  ) {
    const page = params.page ? +params.page : 1;
    const limit = params.limit ? +params.limit : 10;

    const chat = await this.getChatOr404(chatId, storeId);

    await this.prisma.message.updateMany({
      where: { chatId, isRead: false, sender: 'CUSTOMER' },
      data: { isRead: true },
    });

    if (params.search) {
      return await this.findMessagesWithSearch(
        chatId,
        params.search,
        page,
        limit,
      );
    }

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { chatId },
        include: {
          person: { select: { name: true, avatar: true } },
        },
        take: limit,
        skip: (page - 1) * limit,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
      this.prisma.message.count({ where: { chatId } }),
    ]);

    const messagesWithReference = await Promise.all(
      messages.map(async (msg) => {
        if (!msg.quotedMessageId) return msg;

        const messageOriginal = await this.prisma.message.findFirst({
          where: {
            chatId,
            externalMessageId: {
              endsWith: this.onlyExternalId(msg.quotedMessageId),
            },
          },
          include: { person: { select: { name: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
        });

        return {
          ...msg,
          messageOriginal: messageOriginal
            ? {
                id: messageOriginal.id,
                content: messageOriginal.content,
                attachmentUrl: messageOriginal.attachmentUrl,
                attachmentType: messageOriginal.attachmentType,
                createdAt: messageOriginal.createdAt,
                person: messageOriginal.person,
              }
            : null,
        };
      }),
    );

    return {
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      channel: chat.channel,
      messages: messagesWithReference,
    };
  }

  private async findMessagesWithSearch(
    chatId: string,
    search: string,
    page: number,
    limit: number,
  ) {
    const messagesFound = await this.prisma.message.findMany({
      where: {
        chatId,
        content: {
          contains: search,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        sender: true,
        attachmentUrl: true,
        attachmentType: true,
        quotedMessageId: true,
        person: { select: { name: true, avatar: true } },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
      skip: (page - 1) * limit,
    });

    const total = await this.prisma.message.count({
      where: {
        chatId,
        content: {
          contains: search,
          mode: 'insensitive',
        },
      },
    });

    const messagesWithContext = await Promise.all(
      messagesFound.map(async (msg) => {
        const messagesFollowing = await this.prisma.message.count({
          where: {
            chatId,
            OR: [
              { createdAt: { gt: msg.createdAt } },
              {
                createdAt: msg.createdAt,
                id: { gt: msg.id },
              },
            ],
          },
        });

        const pageOriginal = Math.floor(messagesFollowing / limit) + 1;

        let messageOriginal = null;
        if (msg.quotedMessageId) {
          messageOriginal = await this.prisma.message.findFirst({
            where: {
              chatId,
              externalMessageId: {
                endsWith: this.onlyExternalId(msg.quotedMessageId),
              },
            },
            include: { person: { select: { name: true, avatar: true } } },
            orderBy: { createdAt: 'desc' },
          });
        }

        return {
          ...msg,
          pageOriginal,
          positionOriginal: messagesFollowing + 1,
          messageOriginal: messageOriginal
            ? {
                id: messageOriginal.id,
                content: messageOriginal.content,
                attachmentUrl: messageOriginal.attachmentUrl,
                attachmentType: messageOriginal.attachmentType,
                createdAt: messageOriginal.createdAt,
                person: messageOriginal.person,
              }
            : null,
        };
      }),
    );

    return {
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      total,
      search,
      messages: messagesWithContext,
      typeSearch: 'search',
    };
  }

  async markMessageRead(storeId: string, messageId: string) {
    const found = await this.prisma.message.findFirst({
      where: { id: messageId, chat: { storeId } },
      select: { id: true, isRead: true },
    });
    if (!found) throw new AppErrorNotFound('Message not found.');
    return found.isRead
      ? found
      : this.prisma.message.update({
          where: { id: messageId },
          data: { isRead: true },
        });
  }

  async markChatIsRead(storeId: string, chatId: string) {
    const chat = await this.prisma.chat.findFirst({
      where: { id: chatId, storeId },
      select: { id: true },
    });
    if (!chat) throw new AppErrorNotFound('Chat not found.');

    const result = await this.prisma.message.updateMany({
      where: {
        chatId: chatId,
        isRead: false,
        sender: 'CUSTOMER',
        chat: { storeId },
      },
      data: { isRead: true },
    });

    return { messagesUpdated: result.count };
  }

  async findMessageById(messageId: string, storeId: string) {
    const message = await this.prisma.message.findFirst({
      where: {
        id: messageId,
        chat: { storeId },
      },
      include: {
        person: { select: { name: true, avatar: true } },
        chat: { select: { id: true, channel: true } },
      },
    });

    if (!message) throw new AppErrorNotFound('Message not found.');

    // Find message referenciada se existir
    let messageOriginal = null;
    if (message.quotedMessageId) {
      messageOriginal = await this.prisma.message.findFirst({
        where: {
          chatId: message.chatId,
          externalMessageId: {
            endsWith: this.onlyExternalId(message.quotedMessageId),
          },
        },
        include: { person: { select: { name: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }

    return {
      ...message,
      messageOriginal: messageOriginal
        ? {
            id: messageOriginal.id,
            content: messageOriginal.content,
            attachmentUrl: messageOriginal.attachmentUrl,
            attachmentType: messageOriginal.attachmentType,
            createdAt: messageOriginal.createdAt,
            person: messageOriginal.person,
          }
        : null,
    };
  }

  async findPageMessage(
    messageId: string,
    storeId: string,
    limit: number = 10,
  ) {
    const message = await this.prisma.message.findFirst({
      where: {
        id: messageId,
        chat: { storeId },
      },
      select: {
        id: true,
        createdAt: true,
        chatId: true,
      },
    });

    if (!message) throw new AppErrorNotFound('Message not found.');

    const messagesFollowing = await this.prisma.message.count({
      where: {
        chatId: message.chatId,
        OR: [
          { createdAt: { gt: message.createdAt } },
          {
            createdAt: message.createdAt,
            id: { gt: message.id },
          },
        ],
      },
    });

    const page = Math.floor(messagesFollowing / limit) + 1;

    return {
      messageId,
      page,
      limit,
      totalMessagesFollowing: messagesFollowing,
      chatId: message.chatId,
    };
  }

  /**
   * Verifica se a search deve find in conteúof of messages
   */
  private isSearchContentMessage(search: string): boolean {
    const trimmed = search.trim();
    if (trimmed.length < 3) return false;

    // Se contém only números, provavelmente é phone
    if (/^\d+$/.test(trimmed)) return false;

    // Se contém @, provavelmente é email
    if (trimmed.includes('@')) return false;

    return true;
  }

  /**
   * Search messages globalmente
   * Retorna messages que contêm o termo pesquisado, organizadas by relevância
   */
  private async findMessagesGlobal(
    storeId: string,
    userId: string,
    params: FiltersRoutesListing,
  ) {
    const search = params.search || '';
    const page = params.page ? +params.page : 1;
    const limit = params.limit ? +params.limit : 10;

    const [dataUser, employees] = await Promise.all([
      this.findDataUser(storeId, userId),
      this.findEmployeesStore(storeId),
    ]);

    const baseWhere = this.buildFiltersOptimized({
      storeId,
      userId,
      search: '',
      own: params.own,
      channel: params.channel,
      dataStart: params.dataStart,
      dataEnd: params.dataEnd,
      sorting: params.sorting,
      statusChat: params.statusChat,
      idUserAssignee: params.idUserAssignee,
      isStoreOwner: dataUser.isStoreOwner,
      rolesUser: dataUser.rolesUser,
      hasSalespeople: employees.salespeople.length > 0,
      hasPreSalespeople: employees.preSalespeople.length > 0,
    });

    const filterDataMessage: any = {};
    if (params.dataStart) {
      filterDataMessage.gte = new Date(params.dataStart);
    }
    if (params.dataEnd) {
      filterDataMessage.lte = new Date(params.dataEnd);
    }

    const whereConditionMessage: any = {
      content: { contains: search, mode: 'insensitive' },
      chat: baseWhere,
    };

    if (params.dataStart || params.dataEnd) {
      whereConditionMessage.createdAt = filterDataMessage;
    }

    const messagesFound = await this.prisma.message.findMany({
      where: whereConditionMessage,
      include: {
        chat: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                phone: true,
              },
            },
            temporaryCustomer: {
              select: {
                id: true,
                name: true,
                avatar: true,
                whatsapp: true,
              },
            },
            deal: {
              select: {
                id: true,
                status: true,
                dealAssignee: {
                  select: {
                    employee: {
                      select: {
                        userId: true,
                        name: true,
                      },
                    },
                  },
                },
                dealVisit: {
                  select: {
                    id: true,
                    type: true,
                    data: true,
                    completed: true,
                  },
                },
              },
            },
            chatAssignee: {
              select: {
                employee: {
                  select: {
                    userId: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        person: {
          select: {
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Agrupar messages by chat and find messages adicionais of context
    const chatsWithMessages = new Map();

    for (const message of messagesFound) {
      const chatId = message.chat.id;

      if (!chatsWithMessages.has(chatId)) {
        const messagesContext = await this.prisma.message.findMany({
          where: { chatId: chatId },
          select: {
            id: true,
            content: true,
            createdAt: true,
            isRead: true,
            sender: true,
            person: {
              select: {
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        });

        // Count messages não read
        const messagesNotRead = await this.prisma.message.count({
          where: {
            chatId: chatId,
            isRead: false,
            sender: { not: Sender.STORE },
          },
        });

        chatsWithMessages.set(chatId, {
          ...message.chat,
          message: messagesContext,
          messagesNotRead,
          messageFound: {
            id: message.id,
            content: message.content,
            createdAt: message.createdAt,
            sender: message.sender,
          },
        });
      }
    }

    const chatsArray = Array.from(chatsWithMessages.values());

    // Count total for pageção
    const totalMessages = await this.prisma.message.count({
      where: whereConditionMessage,
    });

    const totalPages = Math.ceil(totalMessages / limit);

    return {
      chats: chatsArray,
      pagination: {
        pageCurrent: page,
        totalPages,
        totalItems: totalMessages,
        itemsByPage: limit,
      },
      typeSearch: 'messages',
    };
  }

  async listChats(
    storeId: string,
    userId: string,
    params: FiltersRoutesListing,
  ) {
    const search = params.search || '';
    const page = params.page ? +params.page : 1;
    const limit = params.limit ? +params.limit : 10;

    const shouldSearchMessages = Boolean(search) && search.trim().length >= 3;

    const [dataUser, employees] = await Promise.all([
      this.findDataUser(storeId, userId),
      this.findEmployeesStore(storeId),
    ]);

    const where = this.buildFiltersOptimized({
      storeId,
      userId,
      search,
      own: params.own,
      channel: params.channel,
      dataStart: params.dataStart,
      dataEnd: params.dataEnd,
      sorting: params.sorting,
      statusChat: params.statusChat,
      idUserAssignee: params.idUserAssignee,
      isStoreOwner: dataUser.isStoreOwner,
      rolesUser: dataUser.rolesUser,
      hasSalespeople: employees.salespeople.length > 0,
      hasPreSalespeople: employees.preSalespeople.length > 0,
    });

    let orderBy: any = { createdAt: 'desc' };

    if (params.sorting === 'previous') {
      orderBy = [{ updatedAt: 'asc' }, { createdAt: 'asc' }];
    } else if (params.sorting === 'recent') {
      orderBy = [{ updatedAt: 'desc' }, { createdAt: 'desc' }];
    }

    const filterMessageData: any = {};
    if (params.dataStart || params.dataEnd) {
      if (params.dataStart) {
        filterMessageData.gte = new Date(params.dataStart);
      }
      if (params.dataEnd) {
        filterMessageData.lte = new Date(params.dataEnd);
      }
    }

    const chatsPromise = this.prisma.chat.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            phone: true,
          },
        },
        temporaryCustomer: {
          select: {
            id: true,
            name: true,
            avatar: true,
            whatsapp: true,
          },
        },
        message: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            isRead: true,
            sender: true,
            person: {
              select: {
                avatar: true,
              },
            },
          },
          where:
            Object.keys(filterMessageData).length > 0
              ? { createdAt: filterMessageData }
              : undefined,
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        deal: {
          select: {
            id: true,
            status: true,
            dealAssignee: {
              select: {
                employee: {
                  select: {
                    userId: true,
                    name: true,
                  },
                },
              },
            },
            dealVisit: {
              select: {
                id: true,
                type: true,
                data: true,
                completed: true,
              },
            },
          },
        },
        chatAssignee: {
          select: {
            employee: {
              select: {
                userId: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            message: {
              where: {
                isRead: false,
                sender: 'CUSTOMER',
              },
            },
          },
        },
      },
      orderBy: orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    const messagesPromise = shouldSearchMessages
      ? this.findMessagesGlobal(storeId, userId, params)
      : Promise.resolve(null);

    const [chats, messagesResult] = await Promise.all([
      chatsPromise,
      messagesPromise,
    ]);

    return {
      chats,
      page,
      limit,
      messages: messagesResult
        ? { chats: messagesResult.chats, pagination: messagesResult.pagination }
        : null,
    };
  }

  private async findDataUser(storeId: string, userId: string) {
    const [employee, storeOwner] = await Promise.all([
      this.prisma.employee.findFirst({
        where: { userId, storeId },
        include: { roles: true },
      }),
      this.prisma.storeOwner.findFirst({
        where: { userId, store: { id: storeId } },
      }),
    ]);

    const roles = employee?.roles.map((c) => c.role.toLowerCase()) || [];
    return {
      employee,
      isStoreOwner: !!storeOwner,
      rolesUser: roles,
      isPreSalesperson: roles.some(
        (c) => c.includes('pre-salesperson') || c.includes('pre-salesperson'),
      ),
      isSalesperson: roles.some(
        (c) => c.includes('salesperson') && !c.includes('pre'),
      ),
    };
  }

  private async findEmployeesStore(storeId: string) {
    const [salespeople, preSalespeople] = await Promise.all([
      this.prisma.employee.findMany({
        where: {
          storeId,
          roles: {
            some: {
              role: {
                contains: 'Salesperson',
                mode: 'insensitive',
                not: { contains: 'Pre' },
              },
            },
          },
        },
        select: { id: true },
      }),
      this.prisma.employee.findMany({
        where: {
          storeId,
          roles: {
            some: {
              role: { contains: 'Pre-salesperson', mode: 'insensitive' },
            },
          },
        },
        select: { id: true },
      }),
    ]);
    return { salespeople, preSalespeople };
  }

  private buildFiltersOptimized(params: {
    storeId: string;
    userId: string;
    search: string;
    own?: string;
    channel?: string;
    dataStart?: string;
    dataEnd?: string;
    sorting?: string;
    statusChat?: string;
    idUserAssignee?: string;
    isStoreOwner: boolean;
    rolesUser: string[];
    hasSalespeople: boolean;
    hasPreSalespeople: boolean;
  }): Prisma.ChatWhereInput {
    const {
      storeId,
      userId,
      search,
      own,
      channel,
      dataStart,
      dataEnd,
      statusChat,
      idUserAssignee,
      isStoreOwner,
      rolesUser,
      hasSalespeople,
      hasPreSalespeople,
    } = params;

    const where: Prisma.ChatWhereInput = { storeId };

    if (statusChat !== 'archived') {
      where.archived = false;
    }

    if (channel) {
      where.channel = channel;
    }

    if (dataStart || dataEnd) {
      const filterDataMessage: any = {};
      if (dataStart) {
        filterDataMessage.gte = new Date(dataStart);
      }
      if (dataEnd) {
        filterDataMessage.lte = new Date(dataEnd);
      }

      const existingAnd = Array.isArray(where.AND)
        ? where.AND
        : where.AND
          ? [where.AND]
          : [];
      where.AND = [
        ...existingAnd,
        {
          message: {
            some: {
              createdAt: filterDataMessage,
            },
          },
        },
      ];
    }

    if (statusChat) {
      switch (statusChat) {
        case 'awaiting_reply':
          const dataLimitAwaiting = new Date();
          dataLimitAwaiting.setHours(dataLimitAwaiting.getHours() - 24);

          where.AND = [
            {
              message: {
                some: {
                  sender: Sender.CUSTOMER,
                  createdAt: { gte: dataLimitAwaiting },
                },
              },
            },
            {
              NOT: {
                message: {
                  some: {
                    sender: Sender.STORE,
                    createdAt: { gte: dataLimitAwaiting },
                  },
                },
              },
            },
          ];
          break;
        case 'at_open':
          where.deal = {
            status: {
              notIn: [STATUS_DEAL.SUCCESS, STATUS_DEAL.LOST],
            },
          };
          break;
        case 'finalized':
          where.deal = {
            status: {
              in: [STATUS_DEAL.SUCCESS, STATUS_DEAL.LOST],
            },
          };
          break;
        case 'archived':
          where.archived = true;
          break;
      }
    }

    if (search) {
      where.OR = [
        {
          customer: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
        {
          temporaryCustomer: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { whatsapp: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    if (idUserAssignee) {
      where.deal = {
        dealAssignee: { some: { employee: { userId: idUserAssignee } } },
      };
      return where;
    }

    if (own === 'true') {
      where.deal = { dealAssignee: { some: { employee: { userId } } } };
      return where;
    }

    if (isStoreOwner) return where;

    const isPre = rolesUser.some(
      (c) => c.includes('pre-salesperson') || c.includes('pre-salesperson'),
    );
    const isSales = rolesUser.some(
      (c) => c.includes('salesperson') && !c.includes('pre'),
    );

    const isOnlyPreSalesperson = isPre && !isSales && rolesUser.length === 1;
    if (isOnlyPreSalesperson) {
      where.chatAssignee = { some: { employee: { userId } } };
      return where;
    }

    Object.assign(
      where,
      this.buildFiltersByProfile({
        userId,
        isSalesperson: isSales,
        isPreSalesperson: isPre,
        hasSalespeople,
        hasPreSalespeople,
      }),
    );
    return where;
  }

  private buildFiltersByProfile(params: {
    userId: string;
    isSalesperson: boolean;
    isPreSalesperson: boolean;
    hasSalespeople: boolean;
    hasPreSalespeople: boolean;
  }): Partial<Prisma.ChatWhereInput> {
    const {
      userId,
      isSalesperson,
      isPreSalesperson,
      hasSalespeople,
      hasPreSalespeople,
    } = params;

    const basic = { chatAssignee: { some: { employee: { userId } } } };
    const withoutOwner = [
      { deal: null },
      { deal: { dealAssignee: { none: {} } } },
    ];

    if (isSalesperson && hasSalespeople) {
      if (hasPreSalespeople) return basic;
      return {
        OR: [
          basic,
          ...withoutOwner,
          { deal: { dealAssignee: { some: { employee: { userId } } } } },
        ],
      };
    }

    if (isPreSalesperson && hasPreSalespeople) {
      return {
        OR: [
          basic,
          { deal: { dealAssignee: { some: { employee: { userId } } } } },
          {
            AND: [{ chatAssignee: { none: {} } }, { OR: withoutOwner as any }],
          },
        ],
      };
    }

    return {
      OR: [
        basic,
        ...withoutOwner,
        {
          deal: {
            dealAssignee: {
              some: {
                employee: {
                  OR: [
                    { userId },
                    {
                      roles: {
                        some: {
                          role: isPreSalesperson
                            ? {
                                contains: 'Pre-salesperson',
                                mode: 'insensitive',
                              }
                            : {
                                contains: 'Salesperson',
                                mode: 'insensitive',
                                not: { contains: 'Pre' },
                              },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      ],
    };
  }

  async updateDeal(params: {
    chatId: string;
    dealId: string;
    storeId: string;
  }) {
    const { chatId, dealId, storeId } = params;

    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      select: {
        channel: true,
        externalRecipientId: true,
        dealId: true,
      },
    });

    if (chat) {
      this.invalidateChatCache(storeId, chat.channel, chat.externalRecipientId);

      if (chat.dealId) {
        const oldCacheKey = `${chatId}-${chat.dealId}-deal-check`;
        this.dealCheckCache.delete(oldCacheKey);
      }
    }

    const [deal] = await Promise.all([
      this.prisma.deal.findUnique({
        where: { id: dealId, storeId },
        select: {
          id: true,
          title: true,
          customerId: true,
          temporaryCustomerId: true,
        },
      }),
    ]);

    if (!chat) throw new AppErrorNotFound('Chat not found');
    if (!deal) throw new AppErrorNotFound('Deal not found');

    const updated = await this.prisma.chat.update({
      where: { id: chatId, storeId },
      data: {
        dealId,
        customerId: deal.customerId,
        temporaryCustomerId: deal.temporaryCustomerId,
      },
    });

    await this.prisma.message.create({
      data: {
        sender: Sender.SYSTEM,
        chatId,
        content: `Chat linked to deal ${deal.title}`,
        channel: chat.channel as any,
      },
    });

    return updated;
  }

  async whatsappAvailable(storeId: string, number: string) {
    if (!storeId || !number)
      throw new AppErrorBadRequest('Parameters invalid.');

    try {
      const resp = await this.apiHttp.post<any>(
        `/communication/whatsapp/verify-number`,
        {
          storeId,
          phone: number,
        },
      );

      const payload = resp.data?.data;
      const data = Array.isArray(payload) ? payload[0] : payload;
      if (!data || typeof data.exists !== 'boolean') {
        throw new AppErrorBadRequest('Reply invalid of microservice');
      }

      return {
        exists: data.exists,
        number: data.exists
          ? (data.jid?.split('@')[0] || data.number || number).replace(/\D+/g, '')
          : null,
        numberSearch: number,
      };
    } catch (error) {
      if (error instanceof AppErrorBadRequest) {
        throw error;
      }

      if (error?.response?.status === 400) {
        const errorMsg =
          error?.response?.data?.message ||
          'Integration WhatsApp not configured';
        throw new AppErrorBadRequest(errorMsg);
      }

      if (error?.response?.status >= 500) {
        throw new AppErrorBadRequest('Service temporarily unavailable');
      }

      return { exists: false, number: null, numberSearch: number };
    }
  }

  async findContactByNumber(storeId: string, number: string) {
    if (!storeId || !number)
      throw new AppErrorBadRequest('Parameters invalid.');

    const numberFormatted = normalizePhone(number);

    const customer = await this.prisma.customer.findFirst({
      where: {
        storeId,
        whatsapp: numberFormatted,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        whatsapp: true,
      },
    });

    if (customer) {
      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        avatar: customer.avatarUrl,
        number: customer.whatsapp,
        type: 'customer',
      };
    }

    const temporaryCustomer = await this.prisma.temporaryCustomer.findFirst({
      where: {
        storeId,
        whatsapp: numberFormatted,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        whatsapp: true,
      },
    });

    if (temporaryCustomer) {
      return {
        id: temporaryCustomer.id,
        name: temporaryCustomer.name,
        email: temporaryCustomer.email,
        avatar: temporaryCustomer.avatar,
        number: temporaryCustomer.whatsapp,
        type: 'temporary',
      };
    }

    return null;
  }

  async saveMessageIncoming(params: IncomingMessageDto) {
    await this.getStoreOr404(params.storeId);

    const chat = await this.manageChat(params);
    const typePerson = params.sentByStore ? Sender.STORE : Sender.CUSTOMER;

    if (!params.sentByStore && chat.archived) {
      await this.prisma.chat.update({
        where: { id: chat.id },
        data: { archived: false },
      });
      console.log(
        `Chat ${chat.id} was unarchived automatically after receive message of customer`,
      );
    }

    const isWhatsAppOrInstagram =
      params.channel === IntegrationsEnum.WHATSAPP ||
      params.channel === IntegrationsEnum.INSTAGRAM;

    if (isWhatsAppOrInstagram && params.type !== 'reaction') {
      const dupById = await this.findDuplicateByExternalIdSuffix(
        chat.id,
        params.channel,
        params.messageId,
      );
      if (dupById) {
        console.log(
          `[BACK] Duplicate message blocked by external ID: ${params.messageId}`,
        );
        return dupById;
      }

      if (params.sentByStore && params.messageId) {
        const updated = await this.tryUpdateRecentShopMessageWithExternalId(
          chat.id,
          params.channel,
          params.messageId,
          params.sentByStore,
          params.message,
          params.attachmentUrl,
        );
        if (updated) {
          console.log(
            `[BACK] Updated existing shop message with external ID: ${params.messageId}`,
          );
          return updated;
        }
      }

      if (params.sentByStore) {
        const dupRecent = await this.findRecentDuplicateShopMessage(
          chat.id,
          params,
        );
        if (dupRecent) {
          console.log(
            `[BACK] Duplicate shop message blocked (recent): ${params.messageId}`,
          );
          return dupRecent;
        }
      }

      if (params.message && params.sentByStore) {
        const dupText = await this.findRecentDuplicateShopText(
          chat.id,
          params.message,
        );
        if (dupText) {
          console.log(
            `[BACK] Duplicate shop message blocked (text): ${params.message?.substring(0, 50)}`,
          );
          return dupText;
        }
      }
    }

    if (this.shouldCheckNewDeal(chat, params)) {
      await this.checkAndCreateNewDealIfNeeded(chat.id, params.storeId);
    }

    await this.ensureAssignee(chat.id, params.storeId, (storeId) =>
      this.distService.getEmployeeForDistributionChat(storeId),
    );

    if (params.type === 'reaction' && params.quotedMessageId) {
      const refId = this.onlyExternalId(params.quotedMessageId);
      const target = await this.prisma.message.findFirst({
        where: {
          chatId: chat.id,
          channel: params.channel,
          externalMessageId: { endsWith: refId },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (target)
        await this.prisma.message.update({
          where: { id: target.id },
          data: { reaction: params.message },
        });
      return { ok: true } as any;
    }

    const primary = await this.saveMessage(chat.id, params, {
      name: params.metadata?.name ?? null,
      avatar: null,
      typePerson,
    });

    if (params.contacts?.length) {
      for (const c of params.contacts) {
        await this.saveMessage(
          chat.id,
          {
            ...params,
            message: `Contact shared: ${c.name} - ${c.phone}`,
            attachmentUrl: null,
          },
          { name: params.metadata?.name ?? null, avatar: null, typePerson },
        );
      }
    }

    if (params.location) {
      const { lat, lng, name, address } = params.location;
      let text = `📍 Localização compartilhada:\n• Latitude: ${lat}\n• Longitude: ${lng}\n\n🔗 View in mapa: https://www.google.com/maps?q=${lat},${lng}`;
      if (name) text += `\nLocal: ${name}`;
      if (address) text += `\nEndereço: ${address}`;
      await this.saveMessage(
        chat.id,
        { ...params, message: text, attachmentUrl: null },
        { name: params.metadata?.name ?? null, avatar: null, typePerson },
      );
    }

    if (params.call) {
      const status = this.asUpper(params.call.status, 'Not provided');
      const dataHour = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(params.call.timestamp));
      const text = `📞 Chamada received:\n• Status: ${status}\n• Data/Hour: ${dataHour}`;
      await this.saveMessage(
        chat.id,
        { ...params, message: text, attachmentUrl: null },
        { name: params.metadata?.name ?? null, avatar: null, typePerson },
      );
    }

    return primary;
  }

  private async ensureAssignee(
    chatId: string,
    storeId: string,
    get: (storeId: string) => Promise<string | null>,
  ) {
    const exists = await this.prisma.chatAssignee.findFirst({
      where: { chatId: chatId },
    });
    if (exists) return;
    const idEmployee = await get(storeId);
    if (!idEmployee) return;
    try {
      await this.prisma.chatAssignee.create({
        data: { chatId: chatId, employeeId: idEmployee, storeId },
      });
    } catch {}
  }

  private async tryUpdateRecentShopMessageWithExternalId(
    chatId: string,
    channel: IntegrationsEnum,
    externalMessageId?: string | null,
    sentByStore?: boolean,
    message?: string | null,
    attachmentUrl?: string | null,
  ) {
    if (
      !sentByStore ||
      channel !== IntegrationsEnum.WHATSAPP ||
      !externalMessageId
    )
      return;

    const recent = await this.prisma.message.findFirst({
      where: {
        chatId: chatId,
        sender: Sender.STORE,
        externalMessageId: null,
        createdAt: {
          gte: new Date(Date.now() - DUP_WINDOWS.WHATSAPP_RECENT_MS),
        },
        OR: [
          { content: message ?? '' },
          { attachmentUrl: attachmentUrl ?? null },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!recent) return;
    try {
      await this.prisma.message.update({
        where: { id: recent.id },
        data: { externalMessageId },
      });
      return recent;
    } catch {
      return;
    }
  }

  private async findDuplicateByExternalIdSuffix(
    chatId: string,
    channel: IntegrationsEnum,
    messageId?: string | null,
  ) {
    if (!messageId) return null;
    const ref = this.onlyExternalId(messageId);
    return this.prisma.message.findFirst({
      where: { chatId: chatId, channel, externalMessageId: { endsWith: ref } },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async findRecentDuplicateShopMessage(
    chatId: string,
    params: IncomingMessageDto,
  ) {
    const now = Date.now();
    const recent = await this.prisma.message.findMany({
      where: {
        chatId: chatId,
        sender: Sender.STORE,
        createdAt: {
          gte: new Date(Date.now() - DUP_WINDOWS.WHATSAPP_RECENT_MS),
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        createdAt: true,
        externalMessageId: true,
        content: true,
        attachmentUrl: true,
      },
    });

    return (
      recent.find((msg) => {
        const diff = now - new Date(msg.createdAt as any).getTime();
        if (diff > DUP_WINDOWS.SAME_ID_MS) return false;

        const msgIdEmpty =
          !msg.externalMessageId || msg.externalMessageId.trim() === '';
        const currentIdEmpty =
          !params.messageId || params.messageId.trim() === '';

        if (msgIdEmpty !== currentIdEmpty) {
          if (params.attachmentUrl && msg.attachmentUrl) return true;
          if (params.message && msg.content) {
            const a = this.stripNamePrefix(params.message);
            const b = this.stripNamePrefix(msg.content);
            return a.length > 0 && a === b;
          }
        }
        return false;
      }) || null
    );
  }

  private async findRecentDuplicateShopText(
    chatId: string,
    message?: string | null,
  ) {
    const current = this.stripNamePrefix(message);
    if (!current) return null;

    const recent = await this.prisma.message.findMany({
      where: {
        chatId: chatId,
        sender: Sender.STORE,
        createdAt: { gte: new Date(Date.now() - DUP_WINDOWS.WHATSAPP_TEXT_MS) },
      },
      orderBy: { createdAt: 'desc' },
      take: 4,
      select: { content: true, id: true },
    });

    return (
      recent.find((m) => {
        if (!m.content) return false;
        const existing = this.stripNamePrefix(m.content);
        return existing.length > 0 && existing === current;
      }) || null
    );
  }

  private shouldCheckNewDeal(chat: any, params: IncomingMessageDto): boolean {
    if (params.sentByStore) return false;

    if (!chat.dealId) return false;

    const cacheKey = `${chat.id}-${chat.dealId}-deal-check`;
    const cached = this.dealCheckCache.get(cacheKey);

    if (cached) {
      const now = new Date();
      const cacheAge =
        (now.getTime() - cached.lastCheck.getTime()) / (1000 * 60 * 60);
      if (cacheAge < this.CACHE_TTL_HOURS && !cached.hasFinalized) {
        return false;
      }
    }

    return true;
  }

  private async checkAndCreateNewDealIfNeeded(chatId: string, storeId: string) {
    try {
      const chat = await this.prisma.chat.findUnique({
        where: { id: chatId },
        include: {
          deal: true,
          store: true,
          chatAssignee: true,
        },
      });
      const cacheKey = `${chat.id}-${chat.dealId}-deal-check`;

      if (!chat?.deal) {
        this.dealCheckCache.set(cacheKey, {
          lastCheck: new Date(),
          hasFinalized: false,
        });
        return;
      }

      const isFinalized = this.isDealFinalized(chat.deal.status as STATUS_DEAL);

      this.dealCheckCache.set(cacheKey, {
        lastCheck: new Date(),
        hasFinalized: isFinalized,
      });

      if (!isFinalized) return;

      const gracePeriodMs = this.GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;
      const timeSinceUpdate = Date.now() - chat.deal.updatedAt.getTime();

      if (timeSinceUpdate >= gracePeriodMs) {
        await this.createNewDealFromChat(chatId, storeId, chat, chat.deal);
        this.dealCheckCache.delete(cacheKey);
      }
    } catch (error) {
      console.error(`Error checking deal for chat ${chatId}:`, error);
    }
  }

  private isDealFinalized(status: STATUS_DEAL): boolean {
    const finalizedStatuses = [STATUS_DEAL.SUCCESS, STATUS_DEAL.LOST];
    return finalizedStatuses.includes(status);
  }

  private async createNewDealFromChat(
    chatId: string,
    storeId: string,
    existingChat?: any,
    oldDeal?: any,
  ) {
    try {
      if (!existingChat) {
        console.warn(
          `[createNewDealFromChat] Chat data not provided for ${chatId}`,
        );
        return null;
      }

      const result = await this.prisma.$transaction(async (tx) => {
        const newDeal = await tx.deal.create({
          data: {
            storeId: storeId,
            customerId: existingChat.customerId || null,
            temporaryCustomerId: existingChat.temporaryCustomerId || null,
            status: STATUS_DEAL.CHAT,
            title: oldDeal?.title || 'New deal automatic',
            descriptionDeal:
              oldDeal?.descriptionDeal ||
              'Deal created automatically after period of grace',
            temperature: oldDeal?.temperature || TEMPERATURE_DEAL.WARM,
            note: `Created automatically starting of deal ${oldDeal?.title || 'previous'} after period of grace of ${this.GRACE_PERIOD_DAYS} day(s) with o status ${oldDeal?.status || 'finalized'}.`,
            dealOrigin: 'AUTOMATIC',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          select: {
            id: true,
            title: true,
            status: true,
          },
        });

        const updatedChat = await tx.chat.update({
          where: { id: chatId },
          data: {
            dealId: newDeal.id,
            updatedAt: new Date(),
          },
          select: { id: true },
        });

        await tx.message.create({
          data: {
            chatId: chatId,
            externalRecipientId: existingChat.externalRecipientId,
            channel: existingChat.channel,
            content: `🔄 New deal created automatically after period of grace`,
            sender: Sender.SYSTEM,
            createdAt: new Date(),
          },
          select: { id: true },
        });

        return newDeal;
      });

      console.log(
        `[createNewDealFromChat] New deal ${result.id} created automatically from chat ${chatId} after grace period`,
      );
      return result;
    } catch (error) {
      console.error(
        `[createNewDealFromChat] Error creating new deal from chat ${chatId}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Arquiva automatically chats without deal by more of 7 days
   * @param storeId ID of store for filter os chats
   * @returns Número of chats archived
   */
  async archiveChatsAutomatically(
    storeId?: string,
  ): Promise<{ archived: number; details: string[] }> {
    const dataLimit = new Date();
    dataLimit.setDate(dataLimit.getDate() - 7); // 7 days atrás

    const whereClause: any = {
      archived: false,
      dealId: null, // Chats without deal
      createdAt: {
        lt: dataLimit, // Created há more of 7 days
      },
    };

    // Se storeId for fornecido, filtra by store específica
    if (storeId) {
      whereClause.storeId = storeId;
    }

    try {
      // Search os chats que serão archived for log
      const chatsForArchive = await this.prisma.chat.findMany({
        where: whereClause,
        select: {
          id: true,
          channel: true,
          createdAt: true,
          storeId: true,
          customer: {
            select: { name: true },
          },
          temporaryCustomer: {
            select: { name: true },
          },
        },
      });

      // Arquiva os chats
      const result = await this.prisma.chat.updateMany({
        where: whereClause,
        data: {
          archived: true,
          updatedAt: new Date(),
        } as any,
      });

      // Prepara details for log
      const details = chatsForArchive.map((chat) => {
        const nameCustomer =
          chat.customer?.name ||
          chat.temporaryCustomer?.name ||
          'Customer not identified';
        return `Chat ${chat.id} - ${nameCustomer} (${chat.channel}) - Created at ${chat.createdAt.toLocaleDateString('pt-BR')}`;
      });

      return {
        archived: result.count,
        details,
      };
    } catch (error) {
      console.error('Failed to archive chats automatically:', error);
      throw new HttpException('Error internal to archive chats', 500);
    }
  }

  /**
   * Arquiva or desarquiva um chat manualmente
   * @param chatId ID of chat
   * @param storeId ID of store
   * @param archived Status of archiving (true for archive, false for unarchive)
   * @returns Chat updated
   */
  async updateStatusArchiving(
    chatId: string,
    storeId: string,
    archived: boolean,
  ) {
    try {
      // Check se o chat exists and pertence à store
      const chat = await this.getChatOr404(chatId, storeId);

      // Update o status of archiving
      const chatUpdated = await this.prisma.chat.update({
        where: { id: chatId },
        data: { archived },
        select: {
          id: true,
          archived: true,
          customer: {
            select: {
              name: true,
            },
          },
          temporaryCustomer: {
            select: {
              name: true,
            },
          },
          channel: true,
        },
      });

      return {
        id: chatUpdated.id,
        archived: chatUpdated.archived,
        nameCustomer:
          chatUpdated.customer?.name ||
          chatUpdated.temporaryCustomer?.name ||
          'Customer not identified',
        channel: chatUpdated.channel,
        status: archived ? 'archived' : 'unarchived',
      };
    } catch (error) {
      console.error('Failed to update status of archiving of chat:', error);
      throw new HttpException(
        'Error internal to update status of archiving',
        500,
      );
    }
  }

  /**
   * List chats archived with pageção
   * @param storeId ID of store
   * @param userId ID of usuário
   * @param params Parâmetros of filter and pageção
   * @returns List of chats archived
   */
  async listChatsArchived(
    storeId: string,
    userId: string,
    params: FiltersRoutesListing,
  ) {
    const { page = 1, limit = 10, search = '', sorting = 'desc' } = params;
    const shouldSearchMessages = Boolean(search) && search.trim().length >= 3;

    const dataUser = await this.findDataUser(storeId, userId);
    const employees = await this.findEmployeesStore(storeId);

    const { isStoreOwner, rolesUser } = dataUser;
    const hasSalespeople = employees.salespeople.length > 0;
    const hasPreSalespeople = employees.preSalespeople.length > 0;

    // Constrói filters base forçando archived = true
    const where = this.buildFiltersOptimized({
      storeId,
      userId,
      search,
      own: params.own,
      channel: params.channel,
      dataStart: params.dataStart,
      dataEnd: params.dataEnd,
      sorting,
      statusChat: params.statusChat,
      idUserAssignee: params.idUserAssignee,
      isStoreOwner,
      rolesUser,
      hasSalespeople,
      hasPreSalespeople,
    });

    // Força o filter of archived = true
    (where as any).archived = true;

    const skip = (page - 1) * limit;

    const chatsPromise = this.prisma.chat.findMany({
      where,
      select: {
        id: true,
        channel: true,
        createdAt: true,
        updatedAt: true,
        archived: true,
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        temporaryCustomer: {
          select: {
            id: true,
            name: true,
            whatsapp: true,
          },
        },
        message: {
          select: {
            id: true,
            content: true,
            attachmentUrl: true,
            attachmentType: true,
            createdAt: true,
            sender: true,
            isRead: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        deal: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        chatAssignee: {
          select: {
            employee: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: sorting === 'asc' ? { updatedAt: 'asc' } : { updatedAt: 'desc' },
      skip,
      take: limit,
    });

    const totalPromise = this.prisma.chat.count({ where });

    const messagesPromise = shouldSearchMessages
      ? this.findMessagesGlobal(storeId, userId, {
          ...params,
          statusChat: 'archived',
        })
      : Promise.resolve(null);

    const [chats, total, messagesResult] = await Promise.all([
      chatsPromise,
      totalPromise,
      messagesPromise,
    ]);

    // Account messages não read for cada chat
    const chatsWithCounters = await Promise.all(
      chats.map(async (chat) => {
        const messagesNotRead = await this.prisma.message.count({
          where: {
            chatId: chat.id,
            isRead: false,
            sender: Sender.CUSTOMER,
          },
        });

        return {
          ...chat,
          _count: {
            messagesNotRead,
          },
          message: chat.message[0] || null,
          person: chat.customer || chat.temporaryCustomer,
        };
      }),
    );

    return {
      chats: chatsWithCounters,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      messages: messagesResult
        ? { chats: messagesResult.chats, pagination: messagesResult.pagination }
        : null,
    };
  }
  async receiveLead(payload: OlxReceiveLeadDto) {
    const {
      storeId,
      externalId,
      name,
      email,
      phone,
      message,
      linkAd,
      adId,
      listId,
    } = payload;

    // 1. Upsert TemporaryCustomer
    let temporaryCustomer = await this.prisma.temporaryCustomer.findFirst({
      where: {
        externalContactId: externalId,
        channel: 'olx',
        storeId: storeId,
      },
    });

    if (temporaryCustomer) {
      temporaryCustomer = await this.prisma.temporaryCustomer.update({
        where: { id: temporaryCustomer.id },
        data: {
          name: name,
          email: email,
          whatsapp: phone,
        },
      });
    } else {
      temporaryCustomer = await this.prisma.temporaryCustomer.create({
        data: {
          storeId: storeId,
          externalContactId: externalId || 'N/A', // Fallback if missing, though DTO says optional
          channel: 'olx',
          name: name,
          email: email,
          whatsapp: phone,
        },
      });
    }

    // 2. Upsert Chat
    let chat = await this.prisma.chat.findUnique({
      where: {
        temporaryCustomerId_storeId_channel: {
          temporaryCustomerId: temporaryCustomer.id,
          storeId: storeId,
          channel: 'olx',
        },
      },
    });

    if (!chat) {
      chat = await this.prisma.chat.create({
        data: {
          storeId: storeId,
          temporaryCustomerId: temporaryCustomer.id,
          channel: 'olx',
          externalRecipientId: externalId || 'N/A',
        },
      });
    }

    // 3. Create Message
    const contentMessage = `New Lead OLX:\nAnúncio: ${linkAd}\nMessage: ${message || 'Interest in ad'}`;

    await this.prisma.message.create({
      data: {
        chatId: chat.id,
        channel: 'olx',
        sender: 'CUSTOMER',
        content: contentMessage,
        isRead: false,
        type: 'text',
      },
    });

    // 4. Notifications
    // System Notification
    // Find users to notify (and.g., admins or all users in store)
    const users = await this.prisma.user.findMany({
      where: {
        storeOwner: {
          store: {
            id: storeId,
          },
        },
        status: 'active',
      },
    });

    for (const user of users) {
      await this.notificationsService.createNewNotification({
        userId: user.id,
        message: `New lead OLX received: ${name}`,
        type: TypesNotificationEnum.NEW_MESSAGE,
        idReference: chat.id,
      });
    }

    // Email Notification
    // Get store contact email
    const storeContact = await this.prisma.storeContact.findFirst({
      where: { storeId: storeId },
    });

    if (storeContact && storeContact.email) {
      await this.mailService.sendEmail(
        storeContact.email,
        `New Lead OLX - ${name}`,
        `<p>You received a new lead of OLX!</p>
         <p><strong>Name:</strong> ${name}</p>
         <p><strong>Email:</strong> ${email}</p>
         <p><strong>Phone:</strong> ${phone}</p>
         <p><strong>Message:</strong> ${message}</p>
         <p><strong>Link of Anúncio:</strong> <a href="${linkAd}">${linkAd}</a></p>`,
      );
    }

    return { success: true };
  }
}

const validateLat = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) && v >= -90 && v <= 90
    ? v
    : undefined;

const validateLng = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) && v >= -180 && v <= 180
    ? v
    : undefined;
