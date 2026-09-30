import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatMensagemEntradaDto } from './dto/mensagem.dto';
import { ApiKeyGuard } from 'src/auth/auth/guards/api-key/api-key.guard';
import { ApiExcludeEndpoint } from '@nestjs/swagger';

@Controller('chat')
@UseGuards(ApiKeyGuard)
export class ChatWebhookController {
  constructor(private readonly chatService: ChatService) { }

  @ApiExcludeEndpoint()
  @Post('/mensagem/receber')
  async salvarMensagemEntrada(@Body() params: ChatMensagemEntradaDto) {
    return this.chatService.salvarMensagemEntrada(params);
  }

  @ApiExcludeEndpoint()
  @Post('/mensagem/resposta')
  async salvarMensagemResposta(@Body() params: { storeId: string, plataforma: string, idMensagem?: string, idMensagemExterna?: string }) {
    return this.chatService.salvarMensagemResposta({
      storeId: params.storeId,
      idMensagem: params.idMensagem,
      idMensagemExterna: params.idMensagemExterna
    });
  }
}
