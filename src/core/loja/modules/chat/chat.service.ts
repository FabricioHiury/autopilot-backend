import { HttpException, Injectable, Inject } from '@nestjs/common';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { ChatMensagemEntradaDto, EnviarMensagemDto } from './dto/mensagem.dto';
import { ReturnSendMessage } from './interfaces/mensagem.interface';
import { Prisma } from '@prisma/client';
import { AppErrorBadRequest, AppErrorNotFound } from 'src/utils/errors/app-errors';
import { IntegracoesEnum, Remetente } from './enum/canal.enum';
import { FiltrosRotasListagem } from './dto/filtros.dto';
import { getStringUrlAvatar } from 'src/utils/avatarUtils';
import { FileService } from 'src/persistence/files/file/file.service';
import * as mime from 'mime-types';
import { Readable } from 'stream';
import { AvatarExternoService } from '../avatar-externo/avatar-externo.service';
import { ENUM_TIPO_AVATAR_EXTERNO } from '../avatar-externo/enum/tipo-avatar-externo.enum';
import { normalizePhone } from 'src/utils/phone';
import { DistribuicaoAutomaticaService } from '../atendimento/modules/distribuicao-automatica/distribuicao-automatica.service';
import { AxiosError, AxiosInstance } from 'axios';
import {
  downloadFileContentSafe,
  isBase64Content,
  processBase64Content,
  extractMimeTypeFromUrl,
  generateContentHash,
} from './file-download.utils';
import { STATUS_ATENDIMENTO, TEMPERATURA_ATENDIMENTO } from 'src/utils/enum/atendimento.enum';
import { MailService } from 'src/utils/mail/mail.service';
import { NotificacoesService } from 'src/core/notificacoes/notificacoes.service';
import { OlxReceiveLeadDto } from './dto/receive-lead.dto';
import { TiposNotificacaoEnum } from 'src/utils/enum/notificacoes.enum';

export const AVATAR_INTERNAL_HOST = 'autopilot.firebasestorage.app';

export const DUP_WINDOWS = {
  WHATSAPP_RECENT_MS: 2 * 60_000,
  WHATSAPP_TEXT_MS: 5 * 60_000,
  SAME_ID_MS: 30_000,
};

const URL_MICROSERVICE = {
  MESSAGE: '/communication/message',
}
@Injectable()
export class ChatService {
  private readonly GRACE_PERIOD_DAYS = 1;
  private readonly attendanceCheckCache = new Map<string, { lastCheck: Date; hasFinalized: boolean }>();
  private readonly CACHE_TTL_HOURS = 12; // 12 hours
  private readonly activeChatCache = new Map<string, { chatId: string; lastAccess: Date }>();
  private readonly ACTIVE_CHAT_CACHE_TTL = 30 * 60 * 1000; // 30 min
  
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileService: FileService,
    private readonly avatarExternoService: AvatarExternoService,
    @Inject('API_HTTP') private readonly apiHttp: AxiosInstance,
    private readonly distService: DistribuicaoAutomaticaService,
    private readonly mailService: MailService,
    private readonly notificacoesService: NotificacoesService,
  ) { }

  private oneFileOrThrow(files?: Express.Multer.File[] | null) {
    if (!files?.length) throw new AppErrorBadRequest('É necessário enviar um arquivo.');
    if (files.length > 1) throw new AppErrorBadRequest('Mais de um arquivo foi enviado. Envie apenas um arquivo.');
    return files[0];
  }

  private async getLojaOr404(idLoja: string) {
    const loja = await this.prisma.loja.findUnique({ where: { id: idLoja } });
    if (!loja) throw new AppErrorNotFound('Loja não encontrada.');
    return loja;
  }

  private async getChatOr404(idChat: string, idLoja: string) {
    const chat = await this.prisma.chat.findUnique({ where: { id: idChat, idLoja } });
    if (!chat) throw new AppErrorNotFound('Chat não encontrado.');
    return chat;
  }

  private async getChatLite(chatId: string) {
    return this.prisma.chat.findUnique({
      where: { id: chatId },
      select: {
        id: true,
        canal: true,
        idLoja: true,
        idAtendimento: true,
        loja: { select: { id: true, lojista: { select: { idUsuario: true } } } },
        cliente: { select: { id: true, urlAvatar: true } },
        clienteTemporario: { select: { id: true, avatar: true } },
      },
    });
  }

  private async getUsuarioNomeEAvatar(idUsuario?: string, idLoja?: string) {
    if (idUsuario) {
      const u = await this.prisma.usuario.findUnique({ where: { id: idUsuario }, select: { id: true, nome: true } });
      return { nome: u?.nome ?? null, avatar: u ? getStringUrlAvatar(u.id) : null };
    }
    if (idLoja) {
      const l = await this.prisma.loja.findUnique({
        where: { id: idLoja },
        select: { lojista: { select: { usuario: { select: { id: true, nome: true } } } } },
      });
      const uid = l?.lojista?.usuario?.id;
      return { nome: l?.lojista?.usuario?.nome ?? null, avatar: uid ? getStringUrlAvatar(uid) : null };
    }
    return { nome: null, avatar: null };
  }

  private includeNamePrefix(nome?: string | null, canal?: IntegracoesEnum | string) {
    const allow: IntegracoesEnum[] = [IntegracoesEnum.INSTAGRAM, IntegracoesEnum.WHATSAPP, IntegracoesEnum.FACEBOOK];
    return nome && canal && allow.includes(canal as IntegracoesEnum) ? `*${nome}*:\n` : '';
  }

  private onlyExternalId(v?: string | null) {
    if (!v) return '';
    const m = String(v).match(/([A-F0-9]{20,})$/i);
    return m ? m[1] : String(v);
  }

  private stripNamePrefix(text?: string | null) {
    return (text ?? '').replace(/^\*[^*]+\*:\s*\n/, '').trim();
  }

  private inferMessageTypeFromMimeType(mimeType?: string | null): string | null {
    if (!mimeType) return null;
    const lower = mimeType.toLowerCase();
    if (lower.startsWith('image/')) return 'image';
    if (lower.startsWith('audio/')) return 'audio';
    if (lower.startsWith('video/')) return 'video';
    if (lower === 'application/pdf') return 'document';
    return null;
  }

  private asUpper(v?: string | null, fallback = 'NÃO INFORMADO') {
    return (v ?? fallback).toUpperCase();
  }

  private async findActiveChatByContact(params: {
    idLoja: string;
    canal: string;
    idDestinatarioApiExterna: string;
  }): Promise<any | null> {
    const { idLoja, canal, idDestinatarioApiExterna } = params;
    
    const normalizeRecipient = canal === 'whatsapp' 
      ? normalizePhone(idDestinatarioApiExterna) 
      : idDestinatarioApiExterna;
    
    const cacheKey = `${idLoja}-${canal}-${normalizeRecipient}`;
    
    const cached = this.activeChatCache.get(cacheKey);
    if (cached && (Date.now() - cached.lastAccess.getTime()) < this.ACTIVE_CHAT_CACHE_TTL) {
      const chat = await this.prisma.chat.findUnique({
        where: { id: cached.chatId },
        select: {
          id: true,
          idAtendimento: true,
          criadoEm: true,
          arquivado: true,
          atendimento: {
            select: {
              status: true,
              atualizadoEm: true,
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
        idLoja,
        canal,
        idDestinatarioApiExterna: normalizeRecipient,
        OR: [
          {
            atendimento: {
              status: {
                notIn: [STATUS_ATENDIMENTO.SUCESSO, STATUS_ATENDIMENTO.PERDIDO], 
              },
            },
          },
          {
            idAtendimento: null,
            criadoEm: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        ],
      },
      include: {
        cliente: {
          select: { id: true, nome: true, urlAvatar: true },
        },
        clienteTemporario: {
          select: { id: true, nome: true, avatar: true },
        },
        atendimento: {
          select: {
            id: true,
            status: true,
            atualizadoEm: true,
          },
        },
      },
      orderBy: [
        { idAtendimento: { sort: 'desc', nulls: 'last' } },
        { criadoEm: 'desc' },
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
    if (!chat.atendimento) {
      const hoursSinceCreation = (Date.now() - new Date(chat.criadoEm).getTime()) / (1000 * 60 * 60);
      return hoursSinceCreation <= 24; // 24h
    }
    
    const status = chat.atendimento.status as STATUS_ATENDIMENTO;
    return !this.isAttendanceFinalized(status);
  }
  
  private invalidateChatCache(idLoja: string, canal: string, destinatario: string): void {
    const cacheKey = `${idLoja}-${canal}-${destinatario}`;
    this.activeChatCache.delete(cacheKey);
  }


  private buildMulterLikeFile(fileBuffer: Buffer, mimeType: string, baseName: string): Express.Multer.File {
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

  private async findExistingAttachment(hash: string, idUsuario: string) {
    try {
      const existing = await this.prisma.$queryRaw<Array<{ id: string; url: string; tipo: string | null }>>`
        SELECT a.id, a.url, a.tipo
        FROM arquivo a
        JOIN anexo_hash ah ON ah.arquivo_id = a.id
        WHERE ah.hash = ${hash} AND a.usuario_id = ${idUsuario}
        AND a.entidade LIKE 'chat%'
        LIMIT 1
      `;
      return existing[0] || null;
    } catch {
      return null;
    }
  }

  private async saveAttachmentHash(hash: string, arquivoId: string | null, idUsuario: string) {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO anexo_hash (hash, arquivo_id, usuario_id, criado_em)
        VALUES (${hash}, ${arquivoId}, ${idUsuario}, NOW())
        ON CONFLICT (hash, usuario_id)
        DO UPDATE SET arquivo_id = EXCLUDED.arquivo_id
      `;
    } catch {
      /* noop */
    }
  }

  private async substituirArquivoChat(params: { src: string; chatId: string }): Promise<{ src: string; mimetype: string }> {
    try {
      const src = params.src;
      if (!src) return { src: '', mimetype: 'application/octet-stream' };

      if (src.includes('firebasestorage.googleapis.com') || src.includes('storage.googleapis.com')) {
        return { src, mimetype: extractMimeTypeFromUrl(src) || 'application/octet-stream' };
      }

      const [chat, hash] = await Promise.all([
        this.getChatLite(params.chatId),
        generateContentHash(src)
      ]);

      if (!chat) throw new Error(`Chat ${params.chatId} não encontrado`);

      const idUsuario = chat.loja.lojista.idUsuario;
      const existente = await this.findExistingAttachment(hash, idUsuario);
      if (existente) {
        return { src: existente.url, mimetype: existente.tipo || 'application/octet-stream' };
      }

      let fileBuffer: Buffer, mimeType: string;
      if (isBase64Content(src)) {
        ({ fileBuffer, mimeType } = processBase64Content(src));
      } else {
        ({ fileBuffer, mimeType } = await downloadFileContentSafe(src));
      }

      const arquivo = this.buildMulterLikeFile(fileBuffer, mimeType, 'arquivo');
      const [salvo] = await Promise.all([
        this.fileService.salvarArquivo({
          file: arquivo,
          entidade: 'chat-anexo',
          usuarioId: idUsuario,
          entidadeId: params.chatId,
        }),
        this.saveAttachmentHash(hash, '', idUsuario)
      ]);

      this.saveAttachmentHash(hash, salvo.id, idUsuario).catch(() => { });
      return { src: salvo.url, mimetype: mimeType };
    } catch {
      return { src: params.src, mimetype: 'application/octet-stream' };
    }
  }

  private async substituirArquivoAvatar(params: { src: string; chatId: string }): Promise<string> {
    try {
      const src = params.src;
      if (!src || src.includes(AVATAR_INTERNAL_HOST)) return src;

      const chat = await this.prisma.chat.findUnique({
        where: { id: params.chatId },
        include: { loja: true, clienteTemporario: true, cliente: true },
      });
      if (!chat) throw new Error(`Chat ${params.chatId} não encontrado`);

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

      const arquivo = this.buildMulterLikeFile(fileBuffer, mimeType, 'avatar');
      const tipo: ENUM_TIPO_AVATAR_EXTERNO = chat.cliente
        ? ENUM_TIPO_AVATAR_EXTERNO.CLIENTE
        : ENUM_TIPO_AVATAR_EXTERNO.CLIENTE_TEMP;
      const id = chat.cliente ? chat.cliente.id : chat.clienteTemporario.id;

      await this.avatarExternoService.salvarAvatar({ arquivos: [arquivo], idLoja: chat.loja.id, tipo, id });
      return this.avatarExternoService.pegarUrlAvatar({ idLoja: chat.loja.id, tipo, id });
    } catch {
      return params.src;
    }
  }

  private async upsertAvatarFirebaseIfNeeded(chatId: string, rawUrl?: string): Promise<string | null> {
    if (!rawUrl || rawUrl.includes(AVATAR_INTERNAL_HOST)) return rawUrl ?? null;

    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      select: {
        cliente: { select: { id: true, urlAvatar: true } },
        clienteTemporario: { select: { id: true, avatar: true } },
      },
    });
    if (!chat) return rawUrl ?? null;

    const current = chat.cliente?.urlAvatar ?? chat.clienteTemporario?.avatar ?? null;
    if (current?.includes(AVATAR_INTERNAL_HOST)) return current;

    const processed = await this.substituirArquivoAvatar({ src: rawUrl, chatId });
    if (!processed || processed === rawUrl) return rawUrl;

    if (chat.cliente) {
      await this.prisma.cliente.update({ where: { id: chat.cliente.id }, data: { urlAvatar: processed } });
    } else if (chat.clienteTemporario) {
      await this.prisma.clienteTemporario.update({ where: { id: chat.clienteTemporario.id }, data: { avatar: processed } });
    }
    return processed;
  }

  async pegarChat(idChat: string, idLoja: string) {
    return this.prisma.chat.findUnique({
      where: { id: idChat, idLoja },
      include: { cliente: true, clienteTemporario: true },
    });
  }

  async novoChat(params: {
    idLoja: string;
    idUsuario: string;
    mensagem: EnviarMensagemDto;
    tipoCliente: 'cliente' | 'temporario';
    idCliente?: string;
    nome?: string;
    celular?: string;
  }): Promise<{ idChat: string }> {
    const { idLoja, idUsuario, mensagem, tipoCliente, idCliente, celular } = params;
    const canal = mensagem.canal;

    if (tipoCliente === 'cliente' && (!idCliente)) {
      throw new AppErrorBadRequest('idCliente inválido para tipoCliente=cliente');
    }

    const destinatarioFmt = normalizePhone(canal === 'whatsapp' ? celular || mensagem.destinatario : mensagem.destinatario);

    const chatExistente = await this.findActiveChatByContact({
      idLoja,
      canal,
      idDestinatarioApiExterna: destinatarioFmt,
    });

    if (chatExistente) {
      await this.updateChatInfoIfNeeded(chatExistente, {
        idCliente: tipoCliente === 'cliente' ? idCliente : undefined,
        nome: params.nome,
        enviadaLoja: true,
      });

      await this.enviarMensagem(chatExistente.id, idLoja, idUsuario, { ...mensagem, destinatario: destinatarioFmt });
      return { idChat: chatExistente.id };
    }

    const chat = await this.prisma.$transaction(async (tx) => {
      let idClienteTemporario: string | null = null;
      if (tipoCliente === 'temporario') {
        const whatsapp = normalizePhone(celular || '');
        const temp = await tx.clienteTemporario.create({
          data: { idLoja, canal, nome: params.nome, whatsapp, idContatoApiExterna: destinatarioFmt },
          select: { id: true },
        });
        idClienteTemporario = temp.id;
      }

      const novoChat = await tx.chat.create({
        data: {
          idLoja,
          canal,
          idCliente: tipoCliente === 'cliente' ? idCliente! : null,
          idClienteTemporario,
          idDestinatarioApiExterna: destinatarioFmt,
        },
        select: { id: true },
      });

      const cacheKey = `${idLoja}-${canal}-${destinatarioFmt}`;
      this.activeChatCache.set(cacheKey, {
        chatId: novoChat.id,
        lastAccess: new Date(),
      });

      return novoChat;
    });

    this.invalidateChatCache(idLoja, canal, destinatarioFmt);
    
    await this.enviarMensagem(chat.id, idLoja, idUsuario, { ...mensagem, destinatario: destinatarioFmt });
    return { idChat: chat.id };
  }

  async gerarAnexo(arquivos: Express.Multer.File[], idChat: string) {
    const arquivo = this.oneFileOrThrow(arquivos);
    const chat = await this.getChatLite(idChat);
    if (!chat) throw new AppErrorBadRequest(`Chat de ID ${idChat} não encontrado`);

    const idUsuario = chat.loja.lojista.idUsuario;
    const salvo = await this.fileService.salvarArquivo({
      file: arquivo,
      entidade: 'chat-anexo-upload',
      usuarioId: idUsuario,
      entidadeId: idChat,
    });

    return { src: salvo.url, mimetype: arquivo.mimetype };
  }

  async enviarMensagem(chatId: string, storeId: string, userId: string, dto: EnviarMensagemDto) {
    if (!chatId || !storeId || !userId) throw new AppErrorBadRequest('Parâmetros inválidos.');

    const [chat, user, loja] = await Promise.all([
      this.prisma.chat.findUnique({
        where: { id: chatId, idLoja: storeId },
        select: { id: true, canal: true, idLoja: true }
      }),

      this.prisma.usuario.findUnique({
        where: { id: userId },
        select: { id: true, nome: true },
      }),

      this.prisma.loja.findUnique({
        where: { id: storeId },
        select: { wppApiType: true }
      })
    ]);

    if (!chat) throw new AppErrorNotFound('Chat não encontrado.');
    if (!user) throw new AppErrorNotFound('Usuário não encontrado.');

    const dataUser = {
      nome: user?.nome ?? 'Usuário não identificado',
      avatar: getStringUrlAvatar(user.id),
      tipoPessoa: Remetente.LOJA as const,
      idUsuario: userId,
    };

    const prefix = this.includeNamePrefix(dataUser.nome, chat.canal);
    const {
      latitude,
      longitude,
      mensagem: rawMessage,
      destinatario,
      mensagemReferencia,
      ...rest
    } = dto;

    const lat = validateLat(latitude);
    const lng = validateLng(longitude);

    const inferredType = dto.anexoMensagem ? this.inferMessageTypeFromMimeType(dto.tipoAnexo) : null;
    
    const localMsg = await this.saveMessageOptimized(chatId, {
      ...dto,
      idLoja: storeId,
      idDestinatarioApiExterna: destinatario,
      mensagemReferencia,
      timestamp: new Date(),
      tipo: inferredType,
    } as any, dataUser);

    if (!localMsg) throw new HttpException('Failed to persist local message.', 500);

    try {
      const isReaction = dto.tipo === 'reaction';
      const isWhatsApp = chat.canal === IntegracoesEnum.WHATSAPP;
      const wppApiType = isWhatsApp && loja?.wppApiType ? loja.wppApiType : undefined;
      
      const payload = {
        storeId,
        latitude: lat,
        longitude: lng,
        destinatario,
        idMensagem: localMsg.id,
        mensagem: rawMessage ? (isReaction ? rawMessage : `${prefix}${rawMessage}`) : undefined,
        mensagemReferencia,
        wppApiType,
        ...rest,
      }

      const resp = await this.apiHttp.post<ReturnSendMessage>(URL_MICROSERVICE.MESSAGE, payload, { timeout: 10000 });

      if (resp.status >= 400) {
        const msg = (resp.data as any)?.message || (resp.data as any)?.response || 'Send failed';
        throw new HttpException(msg, resp.status);
      }

      const { data, message } = resp.data as ReturnSendMessage;

      const externalId: string = data.response;

      if (externalId) {
        await this.prisma.mensagem
          .update({
            where: { id: localMsg.id },
            data: { idMensagemExterna: externalId },
          });

        localMsg.idMensagemExterna = externalId;
      }

      return { data: message, mensagemEnviada: localMsg };
    } catch (e: unknown) {
      const err = e as AxiosError;
      const status = err.response?.status ?? 500;
      const msg = (err.response?.data as any)?.message ?? err.message ?? 'Message sending error';
      throw new HttpException(msg, status);
    }
  }

  async salvarMensagemResposta(params: { storeId: string; idMensagem?: string; idMensagemExterna?: string }) {
    if (params.idMensagem && params.idMensagemExterna) {
      await this.prisma.mensagem.update({ where: { id: params.idMensagem }, data: { idMensagemExterna: params.idMensagemExterna } });
    }
    return { ok: true };
  }

  private chatLocks = new Map<string, Promise<any>>();

  private async gerenciarChat(params: ChatMensagemEntradaDto) {
    const CLIENTE_DESCONHECIDO = 'Desconhecido';
    const numero = params.canal === IntegracoesEnum.WHATSAPP ? normalizePhone(params.idDestinatarioApiExterna) : params.idDestinatarioApiExterna;
    const lockKey = `${params.storeId}-${params.canal}-${numero}`;

    if (this.chatLocks.has(lockKey)) {
      try { return await this.chatLocks.get(lockKey); } catch { /* segue */ }
    }

    const lock = (async () => {
      try {
        let chat = await this.findActiveChatByContact({
          idLoja: params.storeId,
          canal: params.canal,
          idDestinatarioApiExterna: numero,
        });

        if (chat) {
          await this.updateChatInfoIfNeeded(chat, {
            metadados: params.metadados,
            enviadaLoja: params.enviadaLoja,
          });
        } else {
          chat = await this.prisma.$transaction(async (tx) => {
            const existente = await tx.chat.findFirst({
              where: { idLoja: params.storeId, idDestinatarioApiExterna: numero, canal: params.canal },
              include: {
                clienteTemporario: {
                  select: { 
                    id: true, 
                    nome: true, 
                    avatar: true 
                  }
                },
              },
            });
            if (existente) return existente;

            const nome = params.enviadaLoja ? CLIENTE_DESCONHECIDO : (params.metadados?.nome ?? CLIENTE_DESCONHECIDO);
            const avatar = params.enviadaLoja ? '' : (params.metadados?.urlAvatar ?? '');

            const temp = await tx.clienteTemporario.create({
              data: {
                idLoja: params.storeId,
                nome,
                avatar,
                whatsapp: params.metadados?.celular,
                email: params.metadados?.email,
                canal: params.canal,
                idContatoApiExterna: params.idDestinatarioApiExterna,
              },
              select: { id: true },
            });

            return tx.chat.create({
              data: {
                idLoja: params.storeId,
                idDestinatarioApiExterna: numero,
                canal: params.canal,
                idClienteTemporario: temp.id,
                idAnuncioExterno: params.metadados?.idAnuncioExterno ?? null,
              },
              include: {
                clienteTemporario: {
                  select: { id: true, nome: true, avatar: true },
                },
              },
            });
          });

          await this.updateChatInfoIfNeeded(chat, {
            metadados: params.metadados,
            enviadaLoja: params.enviadaLoja,
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
  
  private async updateChatInfoIfNeeded(chat: any, params: {
    idCliente?: string;
    nome?: string;
    metadados?: any;
    enviadaLoja?: boolean;
  }): Promise<void> {
    const updates: any = {};
    const clienteTemporarioUpdates: any = {};
    
    if (!chat.idCliente && params.idCliente) {
      updates.idCliente = params.idCliente;
    }
    
    if (chat.clienteTemporario && !params.enviadaLoja) {
      const nomeAtual = chat.clienteTemporario.nome;
      const nomeVazio = !nomeAtual || nomeAtual.trim() === '' || nomeAtual === 'Desconhecido';
      
      const novoNome = params.nome || params.metadados?.nome;
      if (nomeVazio && novoNome && novoNome.trim() !== '' && novoNome !== 'Desconhecido') {
        clienteTemporarioUpdates.nome = novoNome;
      }
      
      const avatarAtual = chat.clienteTemporario.avatar;
      const avatarVazio = !avatarAtual || avatarAtual.trim() === '';
      const novoAvatar = params.metadados?.urlAvatar;
      
      if (avatarVazio && novoAvatar && novoAvatar.trim() !== '') {
        clienteTemporarioUpdates.avatar = novoAvatar;
      }
    }
    
    const promises = [];
    
    if (Object.keys(updates).length > 0) {
      promises.push(
        this.prisma.chat.update({
          where: { id: chat.id },
          data: updates,
        })
      );
    }
    
    if (Object.keys(clienteTemporarioUpdates).length > 0 && chat.clienteTemporario) {
      promises.push(
        this.prisma.clienteTemporario.update({
          where: { id: chat.clienteTemporario.id },
          data: clienteTemporarioUpdates,
        })
      );
    }
    
    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }

  private async salvarMensagem(
    chatId: string,
    params: ChatMensagemEntradaDto,
    pessoa: { nome?: string; avatar?: string; idUsuario?: string; tipoPessoa: Remetente },
  ) {
    const isReaction = params.tipo === 'reaction';

    if (isReaction && params.mensagemReferencia) {
      return await this.prisma.$transaction(async (tx) => {
        const originalMessage = await tx.mensagem.findFirst({
          where: {
            idChat: chatId,
            idMensagemExterna: params.mensagemReferencia,
          },
        });

        if (originalMessage) {
          const updated = await tx.mensagem.update({
            where: { id: originalMessage.id },
            data: { reaction: params.mensagem },
          });

          await tx.chat.update({
            where: { id: chatId },
            data: { atualizadoEm: new Date() },
          });

          return updated;
        }

        return null;
      });
    }

    let tipoAnexo: string | null = null;

    if (params.anexoMensagem) {
      const anexo = await this.substituirArquivoChat({ src: params.anexoMensagem, chatId });
      params.anexoMensagem = anexo.src;
      tipoAnexo = anexo.mimetype;
    }

    if (pessoa.tipoPessoa === Remetente.LOJA && (!pessoa.nome || !pessoa.avatar)) {
      const who = await this.getUsuarioNomeEAvatar(pessoa.idUsuario, params.storeId);
      pessoa.nome = who.nome;
      pessoa.avatar = who.avatar;
    }

    let avatarPessoa = pessoa.avatar ?? null;
    if (pessoa.tipoPessoa === Remetente.CLIENTE && params.metadados?.urlAvatar) {
      avatarPessoa = await this.upsertAvatarFirebaseIfNeeded(chatId, params.metadados.urlAvatar);
    }

    const marcarLido = pessoa.tipoPessoa !== Remetente.CLIENTE;

    const msg = await this.prisma.$transaction(async (tx) => {
      const created = await tx.mensagem.create({
        data: {
          idChat: chatId,
          conteudo: params.mensagem,
          anexoMensagem: params.anexoMensagem,
          tipoAnexo,
          tipo: params.tipo ?? null,
          idMensagemExterna: params.idMensagem,
          canal: params.canal,
          idDestinatarioApiExterna: params.idDestinatarioApiExterna,
          remetente: pessoa.tipoPessoa,
          lido: marcarLido,
          origemInstagram: params.canal === IntegracoesEnum.INSTAGRAM ? params.origemInstagram : null,
          ...(params.timestamp ? { criadoEm: new Date(params.timestamp as any) } : {}),
          ...(params.metadados ? { metadados: params.metadados as any } : {}),
          pessoa: {
            create: { nome: pessoa.nome ?? 'Usuário não indentificado', avatar: avatarPessoa },
          },
          ...(params.mensagemReferencia ? ({ idMensagemReferenciaExt: params.mensagemReferencia } as any) : {}),
        },
      });

      const chatUpdateData: any = { atualizadoEm: new Date() };
      if (pessoa.tipoPessoa === Remetente.CLIENTE) {
        chatUpdateData.ultimaMensagemClienteEm = params.timestamp ? new Date(params.timestamp as any) : new Date();
      }
      await tx.chat.update({ where: { id: chatId }, data: chatUpdateData });

      if (avatarPessoa && pessoa.tipoPessoa === Remetente.CLIENTE) {
        const c = await tx.chat.findUnique({
          where: { id: chatId },
          select: {
            cliente: { select: { id: true, urlAvatar: true } },
            clienteTemporario: { select: { id: true, avatar: true } },
          },
        });

        if (c?.cliente) {
          if ((c.cliente.urlAvatar ?? '') !== avatarPessoa) {
            await tx.cliente.update({ where: { id: c.cliente.id }, data: { urlAvatar: avatarPessoa } });
          }
        } else if (c?.clienteTemporario) {
          const atual = c.clienteTemporario.avatar ?? '';
          const interno = atual.includes(AVATAR_INTERNAL_HOST);
          if (!atual || !interno) {
            await tx.clienteTemporario.update({ where: { id: c.clienteTemporario.id }, data: { avatar: avatarPessoa } });
          }
        }
      }

      return created;
    });

    return msg;
  }

  private async saveMessageOptimized(
    chatId: string,
    params: ChatMensagemEntradaDto,
    pessoa: { nome: string; avatar: string | null; idUsuario: string; tipoPessoa: Remetente },
  ) {
    let tipoAnexo: string | null = null;

    if (params.anexoMensagem) {
      if (params.anexoMensagem.includes('firebasestorage.googleapis.com') ||
        params.anexoMensagem.includes('storage.googleapis.com')) {
        tipoAnexo = extractMimeTypeFromUrl(params.anexoMensagem) || 'application/octet-stream';
      } else {
        const anexo = await this.substituirArquivoChat({ src: params.anexoMensagem, chatId });
        params.anexoMensagem = anexo.src;
        tipoAnexo = anexo.mimetype;
      }
    }

    const marcarLido = pessoa.tipoPessoa !== Remetente.CLIENTE;

    const msg = await this.prisma.$transaction(async (tx) => {
      const chatUpdateData: any = { atualizadoEm: new Date() };
      if (pessoa.tipoPessoa === Remetente.CLIENTE) {
        chatUpdateData.ultimaMensagemClienteEm = params.timestamp ? new Date(params.timestamp as any) : new Date();
      }

      const [created] = await Promise.all([
        tx.mensagem.create({
          data: {
            idChat: chatId,
            conteudo: params.mensagem,
            anexoMensagem: params.anexoMensagem,
            tipoAnexo,
            tipo: params.tipo ?? null,
            idMensagemExterna: params.idMensagem,
            canal: params.canal,
            idDestinatarioApiExterna: params.idDestinatarioApiExterna,
            remetente: pessoa.tipoPessoa,
            lido: marcarLido,
            idUsuario: pessoa.idUsuario,
            ...(params.timestamp ? { criadoEm: new Date(params.timestamp as any) } : {}),
            ...(params.metadados ? { metadados: params.metadados as any } : {}),
            pessoa: {
              create: { nome: pessoa.nome, avatar: pessoa.avatar },
            },
            ...(params.mensagemReferencia ? ({ idMensagemReferenciaExt: params.mensagemReferencia } as any) : {}),
          },
        }),
        tx.chat.update({ where: { id: chatId }, data: chatUpdateData })
      ]);

      return created;
    });

    return msg;
  }

  async buscarMensagensChat(idLoja: string, idChat: string, params: FiltrosRotasListagem) {
    const pagina = params.pagina ? +params.pagina : 1;
    const quantidade = params.quantidade ? +params.quantidade : 10;

    const chat = await this.getChatOr404(idChat, idLoja);

    await this.prisma.mensagem.updateMany({
      where: { idChat, lido: false, remetente: 'CLIENTE' },
      data: { lido: true },
    });

    if (params.pesquisa) {
      return await this.buscarMensagensComPesquisa(idChat, params.pesquisa, pagina, quantidade);
    }

    const [mensagens, total] = await Promise.all([
      this.prisma.mensagem.findMany({
        where: { idChat },
        include: {
          pessoa: { select: { nome: true, avatar: true } }
        },
        take: quantidade,
        skip: (pagina - 1) * quantidade,
        orderBy: [{ criadoEm: 'desc' }, { id: 'desc' }],
      }),
      this.prisma.mensagem.count({ where: { idChat } }),
    ]);

    const mensagensComReferencia = await Promise.all(
      mensagens.map(async (msg) => {
        if (!msg.idMensagemReferenciaExt) return msg;

        const mensagemOriginal = await this.prisma.mensagem.findFirst({
          where: {
            idChat,
            idMensagemExterna: { endsWith: this.onlyExternalId(msg.idMensagemReferenciaExt) }
          },
          include: { pessoa: { select: { nome: true, avatar: true } } },
          orderBy: { criadoEm: 'desc' }
        });

        return {
          ...msg,
          mensagemOriginal: mensagemOriginal ? {
            id: mensagemOriginal.id,
            conteudo: mensagemOriginal.conteudo,
            anexoMensagem: mensagemOriginal.anexoMensagem,
            tipoAnexo: mensagemOriginal.tipoAnexo,
            criadoEm: mensagemOriginal.criadoEm,
            pessoa: mensagemOriginal.pessoa
          } : null
        };
      })
    );

    return {
      pagina,
      quantidade,
      totalPaginas: Math.ceil(total / quantidade),
      canal: chat.canal,
      mensagens: mensagensComReferencia,
    };
  }

  private async buscarMensagensComPesquisa(idChat: string, pesquisa: string, pagina: number, quantidade: number) {
    const mensagensEncontradas = await this.prisma.mensagem.findMany({
      where: {
        idChat,
        conteudo: {
          contains: pesquisa,
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        conteudo: true,
        criadoEm: true,
        remetente: true,
        anexoMensagem: true,
        tipoAnexo: true,
        idMensagemReferenciaExt: true,
        pessoa: { select: { nome: true, avatar: true } }
      },
      orderBy: [{ criadoEm: 'desc' }, { id: 'desc' }],
      take: quantidade,
      skip: (pagina - 1) * quantidade,
    });

    const total = await this.prisma.mensagem.count({
      where: {
        idChat,
        conteudo: {
          contains: pesquisa,
          mode: 'insensitive'
        }
      }
    });

    const mensagensComContexto = await Promise.all(
      mensagensEncontradas.map(async (msg) => {
        const mensagensPosteriores = await this.prisma.mensagem.count({
          where: {
            idChat,
            OR: [
              { criadoEm: { gt: msg.criadoEm } },
              {
                criadoEm: msg.criadoEm,
                id: { gt: msg.id }
              }
            ]
          }
        });

        const paginaOriginal = Math.floor(mensagensPosteriores / quantidade) + 1;

        let mensagemOriginal = null;
        if (msg.idMensagemReferenciaExt) {
          mensagemOriginal = await this.prisma.mensagem.findFirst({
            where: {
              idChat,
              idMensagemExterna: { endsWith: this.onlyExternalId(msg.idMensagemReferenciaExt) }
            },
            include: { pessoa: { select: { nome: true, avatar: true } } },
            orderBy: { criadoEm: 'desc' }
          });
        }

        return {
          ...msg,
          paginaOriginal, 
          posicaoOriginal: mensagensPosteriores + 1, 
          mensagemOriginal: mensagemOriginal ? {
            id: mensagemOriginal.id,
            conteudo: mensagemOriginal.conteudo,
            anexoMensagem: mensagemOriginal.anexoMensagem,
            tipoAnexo: mensagemOriginal.tipoAnexo,
            criadoEm: mensagemOriginal.criadoEm,
            pessoa: mensagemOriginal.pessoa
          } : null
        };
      })
    );

    return {
      pagina,
      quantidade,
      totalPaginas: Math.ceil(total / quantidade),
      total,
      pesquisa,
      mensagens: mensagensComContexto,
      tipoBusca: 'pesquisa' 
    };
  }

  async marcarMensagemLida(idLoja: string, idMensagem: string) {
    const found = await this.prisma.mensagem.findFirst({ where: { id: idMensagem, chat: { idLoja } }, select: { id: true, lido: true } });
    if (!found) throw new AppErrorNotFound('Mensagem não encontrada.');
    return found.lido ? found : this.prisma.mensagem.update({ where: { id: idMensagem }, data: { lido: true } });
  }

  async marcarChatLido(idLoja: string, idChat: string) {
    const chat = await this.prisma.chat.findFirst({ where: { id: idChat, idLoja }, select: { id: true } });
    if (!chat) throw new AppErrorNotFound('Chat não encontrado.');

    const result = await this.prisma.mensagem.updateMany({
      where: {
        idChat: idChat,
        lido: false,
        remetente: 'cliente',
        chat: { idLoja }
      },
      data: { lido: true }
    });

    return { mensagensAtualizadas: result.count };
  }

  async buscarMensagemPorId(messageId: string, idLoja: string) {
    const mensagem = await this.prisma.mensagem.findFirst({
      where: {
        id: messageId,
        chat: { idLoja }
      },
      include: {
        pessoa: { select: { nome: true, avatar: true } },
        chat: { select: { id: true, canal: true } }
      }
    });

    if (!mensagem) throw new AppErrorNotFound('Mensagem não encontrada.');

    // Buscar mensagem referenciada se existir
    let mensagemOriginal = null;
    if (mensagem.idMensagemReferenciaExt) {
      mensagemOriginal = await this.prisma.mensagem.findFirst({
        where: {
          idChat: mensagem.idChat,
          idMensagemExterna: { endsWith: this.onlyExternalId(mensagem.idMensagemReferenciaExt) }
        },
        include: { pessoa: { select: { nome: true, avatar: true } } },
        orderBy: { criadoEm: 'desc' }
      });
    }

    return {
      ...mensagem,
      mensagemOriginal: mensagemOriginal ? {
        id: mensagemOriginal.id,
        conteudo: mensagemOriginal.conteudo,
        anexoMensagem: mensagemOriginal.anexoMensagem,
        tipoAnexo: mensagemOriginal.tipoAnexo,
        criadoEm: mensagemOriginal.criadoEm,
        pessoa: mensagemOriginal.pessoa
      } : null
    };
  }

  async encontrarPaginaMensagem(messageId: string, idLoja: string, quantidade: number = 10) {
    const mensagem = await this.prisma.mensagem.findFirst({
      where: {
        id: messageId,
        chat: { idLoja }
      },
      select: {
        id: true,
        criadoEm: true,
        idChat: true
      }
    });

    if (!mensagem) throw new AppErrorNotFound('Mensagem não encontrada.');

    const mensagensPosteriores = await this.prisma.mensagem.count({
      where: {
        idChat: mensagem.idChat,
        OR: [
          { criadoEm: { gt: mensagem.criadoEm } },
          {
            criadoEm: mensagem.criadoEm,
            id: { gt: mensagem.id }
          }
        ]
      }
    });

    const pagina = Math.floor(mensagensPosteriores / quantidade) + 1;

    return {
      messageId,
      pagina,
      quantidade,
      totalMensagensPosteriores: mensagensPosteriores,
      chatId: mensagem.idChat
    };
  }

  /**
   * Verifica se a pesquisa deve buscar no conteúdo das mensagens
   */
  private isPesquisaConteudoMensagem(pesquisa: string): boolean {
    const trimmed = pesquisa.trim();
    if (trimmed.length < 3) return false;
    
    // Se contém apenas números, provavelmente é telefone
    if (/^\d+$/.test(trimmed)) return false;
    
    // Se contém @, provavelmente é email
    if (trimmed.includes('@')) return false;
    
    return true;
  }

  /**
   * Busca mensagens globalmente 
   * Retorna mensagens que contêm o termo pesquisado, organizadas por relevância
   */
  private async buscarMensagensGlobal(idLoja: string, idUsuario: string, params: FiltrosRotasListagem) {
    const pesquisa = params.pesquisa || '';
    const pagina = params.pagina ? +params.pagina : 1;
    const quantidade = params.quantidade ? +params.quantidade : 10;

    const [dadosUsuario, colabs] = await Promise.all([
      this.buscarDadosUsuario(idLoja, idUsuario),
      this.buscarColaboradoresLoja(idLoja),
    ]);

    const baseWhere = this.construirFiltrosOtimizados({
      idLoja,
      idUsuario,
      pesquisa: '',
      proprios: params.proprios,
      canal: params.canal,
      dataInicio: params.dataInicio,
      dataFim: params.dataFim,
      ordenacao: params.ordenacao,
      statusChat: params.statusChat,
      idUsuarioResponsavel: params.idUsuarioResponsavel,
      isLojista: dadosUsuario.isLojista,
      cargosUsuario: dadosUsuario.cargosUsuario,
      temVendedores: colabs.vendedores.length > 0,
      temPreVendedores: colabs.preVendedores.length > 0,
    });

    const filtroDataMensagem: any = {};
    if (params.dataInicio) {
      filtroDataMensagem.gte = new Date(params.dataInicio);
    }
    if (params.dataFim) {
      filtroDataMensagem.lte = new Date(params.dataFim);
    }

    const whereConditionMensagem: any = {
      conteudo: { contains: pesquisa, mode: 'insensitive' },
      chat: baseWhere,
    };

    if (params.dataInicio || params.dataFim) {
      whereConditionMensagem.criadoEm = filtroDataMensagem;
    }

    const mensagensEncontradas = await this.prisma.mensagem.findMany({
      where: whereConditionMensagem,
      include: {
        chat: {
          include: {
            cliente: { 
              select: { 
                id: true, 
                nome: true, 
                email: true, 
                urlAvatar: true, 
                telefone: true 
              } 
            },
            clienteTemporario: { 
              select: { 
                id: true, 
                nome: true, 
                avatar: true, 
                whatsapp: true 
              } 
            },
            atendimento: {
              select: {
                id: true,
                status: true,
                atendimentoResponsaveis: { 
                  select: { 
                    colaborador: { 
                      select: { 
                        idUsuario: true, 
                        nome: true 
                      } 
                    } 
                  } 
                },
                visitasAtendimento: {
                  select: {
                    id: true,
                    tipo: true,
                    data: true,
                    concluida: true
                  }
                },
              },
            },
            chatResponsaveis: { 
              select: { 
                colaborador: { 
                  select: { 
                    idUsuario: true, 
                    nome: true 
                  } 
                } 
              } 
            },
          }
        },
        pessoa: { 
          select: { 
            avatar: true 
          } 
        }
      },
      orderBy: { criadoEm: 'desc' },
      skip: (pagina - 1) * quantidade,
      take: quantidade,
    });

    // Agrupar mensagens por chat e buscar mensagens adicionais do contexto
    const chatsComMensagens = new Map();
    
    for (const mensagem of mensagensEncontradas) {
      const chatId = mensagem.chat.id;
      
      if (!chatsComMensagens.has(chatId)) {
        const mensagensContexto = await this.prisma.mensagem.findMany({
          where: { idChat: chatId },
          select: { 
            id: true,
            conteudo: true, 
            criadoEm: true, 
            lido: true, 
            remetente: true, 
            pessoa: { 
              select: { 
                avatar: true 
              } 
            } 
          },
          orderBy: { criadoEm: 'desc' },
          take: 5,
        });

        // Contar mensagens não lidas
        const mensagensNaoLidas = await this.prisma.mensagem.count({
          where: {
            idChat: chatId,
            lido: false,
            remetente: { not: Remetente.LOJA }
          }
        });

        chatsComMensagens.set(chatId, {
          ...mensagem.chat,
          mensagem: mensagensContexto,
          mensagensNaoLidas,
          mensagemEncontrada: {
            id: mensagem.id,
            conteudo: mensagem.conteudo,
            criadoEm: mensagem.criadoEm,
            remetente: mensagem.remetente
          }
        });
      }
    }

    const chatsArray = Array.from(chatsComMensagens.values());

    // Contar total para paginação
    const totalMensagens = await this.prisma.mensagem.count({
      where: whereConditionMensagem,
    });

    const totalPaginas = Math.ceil(totalMensagens / quantidade);

    return {
      chats: chatsArray,
      paginacao: {
        paginaAtual: pagina,
        totalPaginas,
        totalItens: totalMensagens,
        itensPorPagina: quantidade,
      },
      tipoBusca: 'mensagens' 
    };
  }

  async listarChats(idLoja: string, idUsuario: string, params: FiltrosRotasListagem) {
    const pesquisa = params.pesquisa || '';
    const pagina = params.pagina ? +params.pagina : 1;
    const quantidade = params.quantidade ? +params.quantidade : 10;

    const shouldSearchMessages = Boolean(pesquisa) && pesquisa.trim().length >= 3;

    const [dadosUsuario, colabs] = await Promise.all([
      this.buscarDadosUsuario(idLoja, idUsuario),
      this.buscarColaboradoresLoja(idLoja),
    ]);

    const where = this.construirFiltrosOtimizados({
      idLoja,
      idUsuario,
      pesquisa,
      proprios: params.proprios,
      canal: params.canal,
      dataInicio: params.dataInicio,
      dataFim: params.dataFim,
      ordenacao: params.ordenacao,
      statusChat: params.statusChat,
      idUsuarioResponsavel: params.idUsuarioResponsavel,
      isLojista: dadosUsuario.isLojista,
      cargosUsuario: dadosUsuario.cargosUsuario,
      temVendedores: colabs.vendedores.length > 0,
      temPreVendedores: colabs.preVendedores.length > 0,
    });

    let orderBy: any = { criadoEm: 'desc' }; 
    
    if (params.ordenacao === 'antigos') {
      orderBy = [{ atualizadoEm: 'asc' }, { criadoEm: 'asc' }]; 
    } else if (params.ordenacao === 'recentes') {
      orderBy = [{ atualizadoEm: 'desc' }, { criadoEm: 'desc' }];
    }

    const filtroMensagemData: any = {};
    if (params.dataInicio || params.dataFim) {
      if (params.dataInicio) {
        filtroMensagemData.gte = new Date(params.dataInicio);
      }
      if (params.dataFim) {
        filtroMensagemData.lte = new Date(params.dataFim);
      }
    }

    const chatsPromise = this.prisma.chat.findMany({
      where,
      include: {
        cliente: { 
          select: { 
            id: true, 
            nome: true, 
            email: true, 
            urlAvatar: true, 
            telefone: true 
          } 
        },
        clienteTemporario: { 
          select: { 
            id: true, 
            nome: true, 
            avatar: true, 
            whatsapp: true 
          } 
        },
        mensagem: {
          select: { 
            id: true,
            conteudo: true, 
            criadoEm: true, 
            lido: true, 
            remetente: true, 
            pessoa: { 
              select: { 
                avatar: true 
              } 
            } 
          },
          where: Object.keys(filtroMensagemData).length > 0 ? { criadoEm: filtroMensagemData } : undefined,
          orderBy: { criadoEm: 'desc' },
          take: 5,
        },
        atendimento: {
          select: {
            id: true,
            status: true,
            atendimentoResponsaveis: { 
              select: { 
                colaborador: { 
                  select: { 
                    idUsuario: true, 
                    nome: true 
                  } 
                } 
              } 
            },
            visitasAtendimento: {
              select: {
                id: true,
                tipo: true,
                data: true,
                concluida: true
              }
            },
          },
        },
        chatResponsaveis: { 
          select: { 
            colaborador: { 
              select: { 
                idUsuario: true, 
                nome: true 
              } 
            } 
          } 
        },
        _count: {
          select: {
            mensagem: {
              where: {
                lido: false,
                remetente: 'CLIENTE'
              }
            }
          }
        }
      },
      orderBy: orderBy,
      skip: (pagina - 1) * quantidade,
      take: quantidade,
    });

    const mensagensPromise = shouldSearchMessages
      ? this.buscarMensagensGlobal(idLoja, idUsuario, params)
      : Promise.resolve(null);

    const [chats, mensagensResultado] = await Promise.all([chatsPromise, mensagensPromise]);

    return {
      chats,
      pagina,
      quantidade,
      mensagens: mensagensResultado
        ? { chats: mensagensResultado.chats, paginacao: mensagensResultado.paginacao }
        : null,
    };
  }

  private async buscarDadosUsuario(idLoja: string, idUsuario: string) {
    const [colaborador, lojista] = await Promise.all([
      this.prisma.colaborador.findFirst({ where: { idUsuario, idLoja }, include: { cargos: true } }),
      this.prisma.lojista.findFirst({ where: { idUsuario, loja: { id: idLoja } } }),
    ]);

    const cargos = colaborador?.cargos.map((c) => c.cargo.toLowerCase()) || [];
    return {
      colaborador,
      isLojista: !!lojista,
      cargosUsuario: cargos,
      isPreVendedor: cargos.some((c) => c.includes('pré-vendedor') || c.includes('pre-vendedor')),
      isVendedor: cargos.some((c) => c.includes('vendedor') && !c.includes('pré')),
    };
  }

  private async buscarColaboradoresLoja(idLoja: string) {
    const [vendedores, preVendedores] = await Promise.all([
      this.prisma.colaborador.findMany({
        where: { idLoja, cargos: { some: { cargo: { contains: 'Vendedor', mode: 'insensitive', not: { contains: 'Pré' } } } } },
        select: { id: true },
      }),
      this.prisma.colaborador.findMany({
        where: { idLoja, cargos: { some: { cargo: { contains: 'Pré-vendedor', mode: 'insensitive' } } } },
        select: { id: true },
      }),
    ]);
    return { vendedores, preVendedores };
  }

  private construirFiltrosOtimizados(params: {
    idLoja: string;
    idUsuario: string;
    pesquisa: string;
    proprios?: string;
    canal?: string;
    dataInicio?: string;
    dataFim?: string;
    ordenacao?: string;
    statusChat?: string;
    idUsuarioResponsavel?: string;
    isLojista: boolean;
    cargosUsuario: string[];
    temVendedores: boolean;
    temPreVendedores: boolean;
  }): Prisma.ChatWhereInput {
    const { idLoja, idUsuario, pesquisa, proprios, canal, dataInicio, dataFim, statusChat, idUsuarioResponsavel, isLojista, cargosUsuario, temVendedores, temPreVendedores } = params;

    const where: Prisma.ChatWhereInput = { idLoja };

    if (statusChat !== 'arquivados') {
      where.arquivado = false;
    }

    if (canal) {
      where.canal = canal;
    }

    if (dataInicio || dataFim) {
      const filtroDataMensagem: any = {};
      if (dataInicio) {
        filtroDataMensagem.gte = new Date(dataInicio);
      }
      if (dataFim) {
        filtroDataMensagem.lte = new Date(dataFim);
      }
      
      const existingAnd = Array.isArray(where.AND) ? where.AND : (where.AND ? [where.AND] : []);
      where.AND = [
        ...existingAnd,
        {
          mensagem: {
            some: {
              criadoEm: filtroDataMensagem
            }
          }
        }
      ];
    }

    if (statusChat) {
      switch (statusChat) {
        case 'aguardando_resposta':
          const dataLimiteAguardando = new Date();
          dataLimiteAguardando.setHours(dataLimiteAguardando.getHours() - 24); 
          
          where.AND = [
            {
              mensagem: {
                some: {
                  remetente: Remetente.CLIENTE,
                  criadoEm: { gte: dataLimiteAguardando }
                }
              }
            },
            {
              NOT: {
                mensagem: {
                  some: {
                    remetente: Remetente.LOJA,
                    criadoEm: { gte: dataLimiteAguardando }
                  }
                }
              }
            }
          ];
          break;
        case 'em_aberto':
          where.atendimento = {
            status: {
              notIn: [STATUS_ATENDIMENTO.SUCESSO, STATUS_ATENDIMENTO.PERDIDO]
            }
          };
          break;
        case 'finalizados':
          where.atendimento = {
            status: {
              in: [
                STATUS_ATENDIMENTO.SUCESSO,
                STATUS_ATENDIMENTO.PERDIDO
              ]
            }
          };
          break;
        case 'arquivados':
          where.arquivado = true;
          break;
      }
    }

    if (pesquisa) {
      where.OR = [
        { 
          cliente: { 
            OR: [
              { nome: { contains: pesquisa, mode: 'insensitive' } }, 
              { email: { contains: pesquisa, mode: 'insensitive' } }, 
              { telefone: { contains: pesquisa, mode: 'insensitive' } }
            ] 
          } 
        },
        { 
          clienteTemporario: { 
            OR: [
              { nome: { contains: pesquisa, mode: 'insensitive' } }, 
              { whatsapp: { contains: pesquisa, mode: 'insensitive' } }
            ] 
          } 
        }
      ];
    }

    if (idUsuarioResponsavel) {
      where.atendimento = { atendimentoResponsaveis: { some: { colaborador: { idUsuario: idUsuarioResponsavel } } } };
      return where;
    }

    if (proprios === 'true') {
      where.atendimento = { atendimentoResponsaveis: { some: { colaborador: { idUsuario } } } };
      return where;
    }

    if (isLojista) return where;

    const isPre = cargosUsuario.some((c) => c.includes('pré-vendedor') || c.includes('pre-vendedor'));
    const isVend = cargosUsuario.some((c) => c.includes('vendedor') && !c.includes('pré'));

    const isOnlyPreVendedor = isPre && !isVend && cargosUsuario.length === 1;
    if (isOnlyPreVendedor) {
      where.chatResponsaveis = { some: { colaborador: { idUsuario } } };
      return where;
    }

    Object.assign(where, this.construirFiltrosPorPerfil({ idUsuario, isVendedor: isVend, isPreVendedor: isPre, temVendedores, temPreVendedores }));
    return where;
  }

  private construirFiltrosPorPerfil(params: {
    idUsuario: string;
    isVendedor: boolean;
    isPreVendedor: boolean;
    temVendedores: boolean;
    temPreVendedores: boolean;
  }): Partial<Prisma.ChatWhereInput> {
    const { idUsuario, isVendedor, isPreVendedor, temVendedores, temPreVendedores } = params;

    const basico = { chatResponsaveis: { some: { colaborador: { idUsuario } } } };
    const semDono = [{ atendimento: null }, { atendimento: { atendimentoResponsaveis: { none: {} } } }];

    if (isVendedor && temVendedores) {
      if (temPreVendedores) return basico;
      return { OR: [basico, ...semDono, { atendimento: { atendimentoResponsaveis: { some: { colaborador: { idUsuario } } } } }] };
    }

    if (isPreVendedor && temPreVendedores) {
      return {
        OR: [
          basico,
          { atendimento: { atendimentoResponsaveis: { some: { colaborador: { idUsuario } } } } },
          { AND: [{ chatResponsaveis: { none: {} } }, { OR: semDono as any }] },
        ],
      };
    }

    return {
      OR: [
        basico,
        ...semDono,
        {
          atendimento: {
            atendimentoResponsaveis: {
              some: {
                colaborador: {
                  OR: [
                    { idUsuario },
                    {
                      cargos: {
                        some: {
                          cargo: isPreVendedor
                            ? { contains: 'Pré-vendedor', mode: 'insensitive' }
                            : { contains: 'Vendedor', mode: 'insensitive', not: { contains: 'Pré' } },
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

  async alterarAtendimento(params: { idChat: string; idAtendimento: string; idLoja: string }) {
    const { idChat, idAtendimento, idLoja } = params;
    
    const chat = await this.prisma.chat.findUnique({
      where: { id: idChat },
      select: {
        canal: true,
        idDestinatarioApiExterna: true,
        idAtendimento: true,
      },
    });
    
    if (chat) {
      this.invalidateChatCache(idLoja, chat.canal, chat.idDestinatarioApiExterna);
      
      if (chat.idAtendimento) {
        const oldCacheKey = `${idChat}-${chat.idAtendimento}-attendance-check`;
        this.attendanceCheckCache.delete(oldCacheKey);
      }
    }

    const [atendimento] = await Promise.all([
      this.prisma.atendimento.findUnique({ where: { id: idAtendimento, idLoja }, select: { id: true, titulo: true, idCliente: true, idClienteTemporario: true } }),
    ]);

    if (!chat) throw new AppErrorNotFound('Chat não encontrado');
    if (!atendimento) throw new AppErrorNotFound('Atendimento não encontrado');

    const atualizado = await this.prisma.chat.update({
      where: { id: idChat, idLoja },
      data: { idAtendimento, idCliente: atendimento.idCliente, idClienteTemporario: atendimento.idClienteTemporario },
    });

    await this.prisma.mensagem.create({
      data: { remetente: Remetente.SISTEMA, idChat, conteudo: `Chat vinculado ao atendimento ${atendimento.titulo}`, canal: chat.canal as any },
    });

    return atualizado;
  }

  async whatsappDisponivel(idLoja: string, numero: string) {
    if (!idLoja || !numero) throw new AppErrorBadRequest('Parâmetros inválidos.');

    try {
      const resp = await this.apiHttp.post<any>(`/communication/whatsapp/verify-number`, {
        storeId: idLoja,
        numero
      });

      const data = resp.data?.data;
      if (!data) {
        throw new AppErrorBadRequest('Resposta inválida do microsserviço');
      }

      return {
        existe: data.exists || false,
        numero: data.exists ? numero : null,
        numeroPesquisa: numero
      };
    } catch (error) {
      if (error instanceof AppErrorBadRequest) {
        throw error;
      }

      if (error?.response?.status === 400) {
        const errorMsg = error?.response?.data?.message || 'Integração WhatsApp não configurada';
        throw new AppErrorBadRequest(errorMsg);
      }

      if (error?.response?.status >= 500) {
        throw new AppErrorBadRequest('Serviço temporariamente indisponível');
      }

      return { existe: false, numero: null, numeroPesquisa: numero };
    }
  }

  async buscarContatoPorNumero(idLoja: string, numero: string) {
    if (!idLoja || !numero) throw new AppErrorBadRequest('Parâmetros inválidos.');

    const numeroFormatado = normalizePhone(numero);

    const cliente = await this.prisma.cliente.findFirst({
      where: {
        idLoja,
        whatsapp: numeroFormatado,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        urlAvatar: true,
        whatsapp: true,
      },
    });

    if (cliente) {
      return {
        id: cliente.id,
        nome: cliente.nome,
        email: cliente.email,
        avatar: cliente.urlAvatar,
        numero: cliente.whatsapp,
        tipo: 'cliente',
      };
    }

    const clienteTemporario = await this.prisma.clienteTemporario.findFirst({
      where: {
        idLoja,
        whatsapp: numeroFormatado,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        avatar: true,
        whatsapp: true,
      },
    });

    if (clienteTemporario) {
      return {
        id: clienteTemporario.id,
        nome: clienteTemporario.nome,
        email: clienteTemporario.email,
        avatar: clienteTemporario.avatar,
        numero: clienteTemporario.whatsapp,
        tipo: 'temporario',
      };
    }

    return null;
  }

  async salvarMensagemEntrada(params: ChatMensagemEntradaDto) {
    await this.getLojaOr404(params.storeId);

    const chat = await this.gerenciarChat(params);
    const tipoPessoa = params.enviadaLoja ? Remetente.LOJA : Remetente.CLIENTE;

    if (!params.enviadaLoja && chat.arquivado) {
      await this.prisma.chat.update({
        where: { id: chat.id },
        data: { arquivado: false }
      });
      console.log(`Chat ${chat.id} foi desarquivado automaticamente após receber mensagem do cliente`);
    }

    const isWhatsAppOrInstagram = params.canal === IntegracoesEnum.WHATSAPP || params.canal === IntegracoesEnum.INSTAGRAM;
    
    if (isWhatsAppOrInstagram && params.tipo !== 'reaction') {
      const dupById = await this.findDuplicateByExternalIdSuffix(chat.id, params.canal, params.idMensagem);
      if (dupById) {
        console.log(`[BACK] Duplicate message blocked by external ID: ${params.idMensagem}`);
        return dupById;
      }

      if (params.enviadaLoja && params.idMensagem) {
        const atualizada = await this.tryUpdateRecentShopMessageWithExternalId(
          chat.id, params.canal, params.idMensagem, params.enviadaLoja, params.mensagem, params.anexoMensagem,
        );
        if (atualizada) {
          console.log(`[BACK] Updated existing shop message with external ID: ${params.idMensagem}`);
          return atualizada;
        }
      }

      if (params.enviadaLoja) {
        const dupRecent = await this.findRecentDuplicateShopMessage(chat.id, params);
        if (dupRecent) {
          console.log(`[BACK] Duplicate shop message blocked (recent): ${params.idMensagem}`);
          return dupRecent;
        }
      }

      if (params.mensagem && params.enviadaLoja) {
        const dupText = await this.findRecentDuplicateShopText(chat.id, params.mensagem);
        if (dupText) {
          console.log(`[BACK] Duplicate shop message blocked (text): ${params.mensagem?.substring(0, 50)}`);
          return dupText;
        }
      }
    }

    if (this.shouldCheckNewAttendance(chat, params)) {
      await this.checkAndCreateNewAttendanceIfNeeded(chat.id, params.storeId);
    }

    await this.ensureResponsavel(chat.id, params.storeId, (idLoja) => this.distService.obterColaboradorParaDistribuicaoChat(idLoja));

    if (params.tipo === 'reaction' && params.mensagemReferencia) {
      const refId = this.onlyExternalId(params.mensagemReferencia);
      const alvo = await this.prisma.mensagem.findFirst({
        where: { idChat: chat.id, canal: params.canal, idMensagemExterna: { endsWith: refId } },
        orderBy: { criadoEm: 'desc' },
      });
      if (alvo) await this.prisma.mensagem.update({ where: { id: alvo.id }, data: { reaction: params.mensagem } });
      return { ok: true } as any;
    }

    const principal = await this.salvarMensagem(chat.id, params, {
      nome: params.metadados?.nome ?? null,
      avatar: null,
      tipoPessoa,
    });

    if (params.contatos?.length) {
      for (const c of params.contatos) {
        await this.salvarMensagem(
          chat.id,
          { ...params, mensagem: `Contato compartilhado: ${c.name} - ${c.phone}`, anexoMensagem: null },
          { nome: params.metadados?.nome ?? null, avatar: null, tipoPessoa },
        );
      }
    }

    if (params.location) {
      const { lat, lng, name, address } = params.location;
      let texto = `📍 Localização compartilhada:\n• Latitude: ${lat}\n• Longitude: ${lng}\n\n🔗 Ver no mapa: https://www.google.com/maps?q=${lat},${lng}`;
      if (name) texto += `\nLocal: ${name}`;
      if (address) texto += `\nEndereço: ${address}`;
      await this.salvarMensagem(chat.id, { ...params, mensagem: texto, anexoMensagem: null }, { nome: params.metadados?.nome ?? null, avatar: null, tipoPessoa });
    }

    if (params.call) {
      const status = this.asUpper(params.call.status, 'Não informado');
      const dataHora = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        .format(new Date(params.call.timestamp));
      const texto = `📞 Chamada recebida:\n• Status: ${status}\n• Data/Hora: ${dataHora}`;
      await this.salvarMensagem(chat.id, { ...params, mensagem: texto, anexoMensagem: null }, { nome: params.metadados?.nome ?? null, avatar: null, tipoPessoa });
    }

    return principal;
  }

  private async ensureResponsavel(chatId: string, idLoja: string, obter: (idLoja: string) => Promise<string | null>) {
    const existe = await this.prisma.chatResponsaveis.findFirst({ where: { idChat: chatId } });
    if (existe) return;
    const idColab = await obter(idLoja);
    if (!idColab) return;
    try { await this.prisma.chatResponsaveis.create({ data: { idChat: chatId, idColaborador: idColab, idLoja } }); } catch { }
  }

  private async tryUpdateRecentShopMessageWithExternalId(
    chatId: string,
    canal: IntegracoesEnum,
    idMensagemExterna?: string | null,
    enviadaLoja?: boolean,
    mensagem?: string | null,
    anexoMensagem?: string | null,
  ) {
    if (!enviadaLoja || canal !== IntegracoesEnum.WHATSAPP || !idMensagemExterna) return;

    const recente = await this.prisma.mensagem.findFirst({
      where: {
        idChat: chatId,
        remetente: Remetente.LOJA,
        idMensagemExterna: null,
        criadoEm: { gte: new Date(Date.now() - DUP_WINDOWS.WHATSAPP_RECENT_MS) },
        OR: [{ conteudo: mensagem ?? '' }, { anexoMensagem: anexoMensagem ?? null }],
      },
      orderBy: { criadoEm: 'desc' },
    });

    if (!recente) return;
    try {
      await this.prisma.mensagem.update({ where: { id: recente.id }, data: { idMensagemExterna } });
      return recente;
    } catch {
      return;
    }
  }

  private async findDuplicateByExternalIdSuffix(chatId: string, canal: IntegracoesEnum, idMensagem?: string | null) {
    if (!idMensagem) return null;
    const ref = this.onlyExternalId(idMensagem);
    return this.prisma.mensagem.findFirst({
      where: { idChat: chatId, canal, idMensagemExterna: { endsWith: ref } },
      orderBy: { criadoEm: 'desc' },
    });
  }

  private async findRecentDuplicateShopMessage(chatId: string, params: ChatMensagemEntradaDto) {
    const agora = Date.now();
    const recentes = await this.prisma.mensagem.findMany({
      where: { idChat: chatId, remetente: Remetente.LOJA, criadoEm: { gte: new Date(Date.now() - DUP_WINDOWS.WHATSAPP_RECENT_MS) } },
      orderBy: { criadoEm: 'desc' },
      take: 5,
      select: { id: true, criadoEm: true, idMensagemExterna: true, conteudo: true, anexoMensagem: true },
    });

    return (
      recentes.find((msg) => {
        const diff = agora - new Date(msg.criadoEm as any).getTime();
        if (diff > DUP_WINDOWS.SAME_ID_MS) return false;

        const msgIdVazio = !msg.idMensagemExterna || msg.idMensagemExterna.trim() === '';
        const atualIdVazio = !params.idMensagem || params.idMensagem.trim() === '';

        if (msgIdVazio !== atualIdVazio) {
          if (params.anexoMensagem && msg.anexoMensagem) return true;
          if (params.mensagem && msg.conteudo) {
            const a = this.stripNamePrefix(params.mensagem);
            const b = this.stripNamePrefix(msg.conteudo);
            return a.length > 0 && a === b;
          }
        }
        return false;
      }) || null
    );
  }

  private async findRecentDuplicateShopText(chatId: string, mensagem?: string | null) {
    const atual = this.stripNamePrefix(mensagem);
    if (!atual) return null;

    const recentes = await this.prisma.mensagem.findMany({
      where: { idChat: chatId, remetente: Remetente.LOJA, criadoEm: { gte: new Date(Date.now() - DUP_WINDOWS.WHATSAPP_TEXT_MS) } },
      orderBy: { criadoEm: 'desc' },
      take: 4,
      select: { conteudo: true, id: true },
    });

    return recentes.find((m) => {
      if (!m.conteudo) return false;
      const existente = this.stripNamePrefix(m.conteudo);
      return existente.length > 0 && existente === atual;
    }) || null;
  }

  private shouldCheckNewAttendance(chat: any, params: ChatMensagemEntradaDto): boolean {
    if (params.enviadaLoja) return false;

    if (!chat.idAtendimento) return false;

    const cacheKey = `${chat.id}-${chat.idAtendimento}-attendance-check`;
    const cached = this.attendanceCheckCache.get(cacheKey);
    
    if (cached) {
      const now = new Date();
      const cacheAge = (now.getTime() - cached.lastCheck.getTime()) / (1000 * 60 * 60); 
      if (cacheAge < this.CACHE_TTL_HOURS && !cached.hasFinalized) {
        return false;
      }
    }

    return true;
  }

  private async checkAndCreateNewAttendanceIfNeeded(chatId: string, storeId: string) {
    try {
      const chat = await this.prisma.chat.findUnique({
        where: { id: chatId },
        include: {
          atendimento: true,
          loja: true,
          chatResponsaveis: true
        }
      });
      const cacheKey = `${chat.id}-${chat.idAtendimento}-attendance-check`;

      if (!chat?.atendimento) {
        this.attendanceCheckCache.set(cacheKey, {
          lastCheck: new Date(),
          hasFinalized: false
        });
        return;
      }

      const isFinalized = this.isAttendanceFinalized(chat.atendimento.status as STATUS_ATENDIMENTO);
      
      this.attendanceCheckCache.set(cacheKey, {
        lastCheck: new Date(),
        hasFinalized: isFinalized
      });

      if (!isFinalized) return;

      const gracePeriodMs = this.GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;
      const timeSinceUpdate = Date.now() - chat.atendimento.atualizadoEm.getTime();
      
      if (timeSinceUpdate >= gracePeriodMs) {
        await this.createNewAttendanceFromChat(chatId, storeId, chat, chat.atendimento);
        this.attendanceCheckCache.delete(cacheKey);
      }
    } catch (error) {
      console.error(`Error checking attendance for chat ${chatId}:`, error);
    }
  }

  private isAttendanceFinalized(status: STATUS_ATENDIMENTO): boolean {
    const finalizedStatuses = [
      STATUS_ATENDIMENTO.SUCESSO,
      STATUS_ATENDIMENTO.PERDIDO
    ];
    return finalizedStatuses.includes(status);
  }

  private async createNewAttendanceFromChat(
    chatId: string, 
    storeId: string, 
    existingChat?: any,
    oldAttendance?: any,
  ) {
    try {
      if (!existingChat) {
        console.warn(`[createNewAttendanceFromChat] Chat data not provided for ${chatId}`);
        return null;
      }

      const result = await this.prisma.$transaction(async (tx) => {
        const newAttendance = await tx.atendimento.create({
          data: {
            idLoja: storeId,
            idCliente: existingChat.idCliente || null,
            idClienteTemporario: existingChat.idClienteTemporario || null,
            status: STATUS_ATENDIMENTO.CHAT,
            titulo: oldAttendance?.titulo || 'Novo atendimento automático',
            descricaoAtendimento: oldAttendance?.descricaoAtendimento || 'Atendimento criado automaticamente após período de carência',
            temperatura: oldAttendance?.temperatura || TEMPERATURA_ATENDIMENTO.MORNO,
            observacao: `Criado automaticamente a partir do atendimento ${oldAttendance?.titulo || 'anterior'} após período de carência de ${this.GRACE_PERIOD_DAYS} dia(s) com o status ${oldAttendance?.status || 'finalizado'}.`,
            origemAtendimento: 'AUTOMATICO',
            criadoEm: new Date(),
            atualizadoEm: new Date(),
          },
          select: {
            id: true,
            titulo: true,
            status: true
          }
        });

        const updatedChat = await tx.chat.update({
          where: { id: chatId },
          data: { 
            idAtendimento: newAttendance.id,
            atualizadoEm: new Date()
          },
          select: { id: true }
        });

        await tx.mensagem.create({
          data: {
            idChat: chatId,
            idDestinatarioApiExterna: existingChat.idDestinatarioApiExterna,
            canal: existingChat.canal,
            conteudo: `🔄 Novo atendimento criado automaticamente após período de carência`,
            remetente: Remetente.SISTEMA, 
            criadoEm: new Date(),
          },
          select: { id: true }
        });

        return newAttendance;
      });

      console.log(`[createNewAttendanceFromChat] New attendance ${result.id} created automatically from chat ${chatId} after grace period`);
      return result;
      
    } catch (error) {
      console.error(`[createNewAttendanceFromChat] Error creating new attendance from chat ${chatId}:`, error);
      return null;
    }
  }

  /**
   * Arquiva automaticamente chats sem atendimento por mais de 7 dias
   * @param idLoja ID da loja para filtrar os chats
   * @returns Número de chats arquivados
   */
  async arquivarChatsAutomaticamente(idLoja?: string): Promise<{ arquivados: number; detalhes: string[] }> {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 7); // 7 dias atrás

    const whereClause: any = {
      arquivado: false,
      idAtendimento: null, // Chats sem atendimento
      criadoEm: {
        lt: dataLimite // Criados há mais de 7 dias
      }
    };

    // Se idLoja for fornecido, filtra por loja específica
    if (idLoja) {
      whereClause.idLoja = idLoja;
    }

    try {
      // Busca os chats que serão arquivados para log
      const chatsParaArquivar = await this.prisma.chat.findMany({
        where: whereClause,
        select: {
          id: true,
          canal: true,
          criadoEm: true,
          idLoja: true,
          cliente: {
            select: { nome: true }
          },
          clienteTemporario: {
            select: { nome: true }
          }
        }
      });

      // Arquiva os chats
      const resultado = await this.prisma.chat.updateMany({
        where: whereClause,
        data: {
          arquivado: true,
          atualizadoEm: new Date()
        } as any
      });

      // Prepara detalhes para log
      const detalhes = chatsParaArquivar.map(chat => {
        const nomeCliente = chat.cliente?.nome || chat.clienteTemporario?.nome || 'Cliente não identificado';
        return `Chat ${chat.id} - ${nomeCliente} (${chat.canal}) - Criado em ${chat.criadoEm.toLocaleDateString('pt-BR')}`;
      });

      return {
        arquivados: resultado.count,
        detalhes
      };
    } catch (error) {
      console.error('Erro ao arquivar chats automaticamente:', error);
      throw new HttpException('Erro interno ao arquivar chats', 500);
    }
  }

  /**
   * Arquiva ou desarquiva um chat manualmente
   * @param idChat ID do chat
   * @param idLoja ID da loja
   * @param arquivado Status de arquivamento (true para arquivar, false para desarquivar)
   * @returns Chat atualizado
   */
  async alterarStatusArquivamento(idChat: string, idLoja: string, arquivado: boolean) {
    try {
      // Verificar se o chat existe e pertence à loja
      const chat = await this.getChatOr404(idChat, idLoja);

      // Atualizar o status de arquivamento
      const chatAtualizado = await this.prisma.chat.update({
        where: { id: idChat },
        data: { arquivado },
        select: {
          id: true,
          arquivado: true,
          cliente: {
            select: {
              nome: true,
            }
          },
          clienteTemporario: {
            select: {
              nome: true,
            }
          },
          canal: true,
        }
      });

      return {
        id: chatAtualizado.id,
        arquivado: chatAtualizado.arquivado,
        nomeCliente: chatAtualizado.cliente?.nome || chatAtualizado.clienteTemporario?.nome || 'Cliente não identificado',
        canal: chatAtualizado.canal,
        status: arquivado ? 'arquivado' : 'desarquivado'
      };
    } catch (error) {
      console.error('Erro ao alterar status de arquivamento do chat:', error);
      throw new HttpException('Erro interno ao alterar status de arquivamento', 500);
    }
  }

  /**
   * Lista chats arquivados com paginação
   * @param idLoja ID da loja
   * @param idUsuario ID do usuário
   * @param params Parâmetros de filtro e paginação
   * @returns Lista de chats arquivados
   */
  async listarChatsArquivados(idLoja: string, idUsuario: string, params: FiltrosRotasListagem) {
    const { pagina = 1, quantidade = 10, pesquisa = '', ordenacao = 'desc' } = params;
    const shouldSearchMessages = Boolean(pesquisa) && pesquisa.trim().length >= 3;

    const dadosUsuario = await this.buscarDadosUsuario(idLoja, idUsuario);
    const colaboradores = await this.buscarColaboradoresLoja(idLoja);

    const { isLojista, cargosUsuario } = dadosUsuario;
    const temVendedores = colaboradores.vendedores.length > 0;
    const temPreVendedores = colaboradores.preVendedores.length > 0;

    // Constrói filtros base forçando arquivado = true
    const where = this.construirFiltrosOtimizados({
      idLoja,
      idUsuario,
      pesquisa,
      proprios: params.proprios,
      canal: params.canal,
      dataInicio: params.dataInicio,
      dataFim: params.dataFim,
      ordenacao,
      statusChat: params.statusChat,
      idUsuarioResponsavel: params.idUsuarioResponsavel,
      isLojista,
      cargosUsuario,
      temVendedores,
      temPreVendedores
    });

    // Força o filtro de arquivado = true
    (where as any).arquivado = true;

    const skip = (pagina - 1) * quantidade;

    const chatsPromise = this.prisma.chat.findMany({
        where,
        select: {
          id: true,
          canal: true,
          criadoEm: true,
          atualizadoEm: true,
          arquivado: true,
          cliente: {
            select: {
              id: true,
              nome: true,
              telefone: true,
              email: true
            }
          },
          clienteTemporario: {
            select: {
              id: true,
              nome: true,
              whatsapp: true
            }
          },
          mensagem: {
            select: {
              id: true,
              conteudo: true,
              anexoMensagem: true,
              tipoAnexo: true,
              criadoEm: true,
              remetente: true,
              lido: true
            },
            orderBy: { criadoEm: 'desc' },
            take: 1
          },
          atendimento: {
            select: {
              id: true,
              status: true,
              criadoEm: true,
              atualizadoEm: true
            }
          },
          chatResponsaveis: {
            select: {
              colaborador: {
                select: {
                  id: true,
                  nome: true
                }
              }
            }
          }
        },
        orderBy: ordenacao === 'asc' ? { atualizadoEm: 'asc' } : { atualizadoEm: 'desc' },
        skip,
        take: quantidade
      });

    const totalPromise = this.prisma.chat.count({ where });

    const mensagensPromise = shouldSearchMessages
      ? this.buscarMensagensGlobal(idLoja, idUsuario, { ...params, statusChat: 'arquivados' })
      : Promise.resolve(null);

    const [chats, total, mensagensResultado] = await Promise.all([
      chatsPromise,
      totalPromise,
      mensagensPromise,
    ]);

    // Conta mensagens não lidas para cada chat
    const chatsComContadores = await Promise.all(
      chats.map(async (chat) => {
        const mensagensNaoLidas = await this.prisma.mensagem.count({
          where: {
            idChat: chat.id,
            lido: false,
            remetente: Remetente.CLIENTE
          }
        });

        return {
          ...chat,
          _count: {
            mensagensNaoLidas
          },
          mensagem: chat.mensagem[0] || null,
          pessoa: chat.cliente || chat.clienteTemporario
        };
      })
    );

    return {
      chats: chatsComContadores,
      total,
      pagina,
      quantidade,
      totalPaginas: Math.ceil(total / quantidade),
      mensagens: mensagensResultado
        ? { chats: mensagensResultado.chats, paginacao: mensagensResultado.paginacao }
        : null,
    };
  }
  async receiveLead(payload: OlxReceiveLeadDto) {
    const { storeId, externalId, name, email, phone, message, linkAd, adId, listId } = payload;

    // 1. Upsert ClienteTemporario
    let clienteTemporario = await this.prisma.clienteTemporario.findFirst({
      where: {
        idContatoApiExterna: externalId,
        canal: 'olx',
        idLoja: storeId,
      },
    });

    if (clienteTemporario) {
      clienteTemporario = await this.prisma.clienteTemporario.update({
        where: { id: clienteTemporario.id },
        data: {
          nome: name,
          email: email,
          whatsapp: phone,
        },
      });
    } else {
      clienteTemporario = await this.prisma.clienteTemporario.create({
        data: {
          idLoja: storeId,
          idContatoApiExterna: externalId || 'N/A', // Fallback if missing, though DTO says optional
          canal: 'olx',
          nome: name,
          email: email,
          whatsapp: phone,
        },
      });
    }

    // 2. Upsert Chat
    let chat = await this.prisma.chat.findUnique({
      where: {
        idClienteTemporario_idLoja_canal: {
          idClienteTemporario: clienteTemporario.id,
          idLoja: storeId,
          canal: 'olx',
        },
      },
    });

    if (!chat) {
      chat = await this.prisma.chat.create({
        data: {
          idLoja: storeId,
          idClienteTemporario: clienteTemporario.id,
          canal: 'olx',
          idDestinatarioApiExterna: externalId || 'N/A',
        },
      });
    }

    // 3. Create Message
    const conteudoMensagem = `Novo Lead OLX:\nAnúncio: ${linkAd}\nMensagem: ${message || 'Interesse no anúncio'}`;
    
    await this.prisma.mensagem.create({
      data: {
        idChat: chat.id,
        canal: 'olx',
        remetente: 'cliente',
        conteudo: conteudoMensagem,
        lido: false,
        tipo: 'text',
      },
    });

    // 4. Notifications
    // System Notification
    // Find users to notify (e.g., admins or all users in store)
    const users = await this.prisma.usuario.findMany({
      where: {
        lojista: {
          loja: {
            id: storeId,
          },
        },
        status: 'ativo',
      },
    });

    for (const user of users) {
      await this.notificacoesService.criarNovaNotificacao({
        idUsuario: user.id,
        mensagem: `Novo lead OLX recebido: ${name}`,
        tipo: TiposNotificacaoEnum.NOVA_MENSAGEM,
        idReferencia: chat.id,
      });
    }

    // Email Notification
    // Get store contact email
    const contatoLoja = await this.prisma.contatoLoja.findFirst({
      where: { idLoja: storeId },
    });

    if (contatoLoja && contatoLoja.email) {
       await this.mailService.sendEmail(
        contatoLoja.email,
        `Novo Lead OLX - ${name}`,
        `<p>Você recebeu um novo lead da OLX!</p>
         <p><strong>Nome:</strong> ${name}</p>
         <p><strong>Email:</strong> ${email}</p>
         <p><strong>Telefone:</strong> ${phone}</p>
         <p><strong>Mensagem:</strong> ${message}</p>
         <p><strong>Link do Anúncio:</strong> <a href="${linkAd}">${linkAd}</a></p>`
      );
    }
    
    return { success: true };
  }
}

const validateLat = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) && v >= -90 && v <= 90 ? v : undefined;

const validateLng = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) && v >= -180 && v <= 180 ? v : undefined;