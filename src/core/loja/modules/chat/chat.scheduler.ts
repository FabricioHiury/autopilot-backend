import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ChatService } from './chat.service';

@Injectable()
export class ChatScheduler {
  constructor(private readonly chatService: ChatService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async executarArquivamentoAutomatico() {
    console.log('Iniciando job de arquivamento automático de chats');
    try {
      const resultado = await this.chatService.arquivarChatsAutomaticamente();
      console.log(`Arquivamento automático concluído: ${resultado.arquivados} chats arquivados`);
    } catch (error) {
      console.error('Erro ao executar arquivamento automático de chats:', error);
    }
  }
}