import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { EnviarMensagemDto } from './dto/mensagem.dto';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { UsuarioId } from 'src/auth/auth/decorators/usuario-id-decorator';
import { ApiTags } from '@nestjs/swagger';
import { FiltrosRotasListagem } from './dto/filtros.dto';
import { LojaId } from 'src/auth/auth/decorators/loja-id-decorator';
import {
  enviarMensagemDocs,
  listarChatsDocs,
  listarMensagensChatDocs,
  alterarAtendimentoChatDoc,
} from './docs/chat.swagger';
import { arquivarChatDocs, desarquivarChatDocs } from './docs/endpoints/arquivar-chat.swagger';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { AssinaturaGuard } from 'src/core/backoffice/modules/assinatura/guards/assinatura.guard';
import { IsPublic } from 'src/auth/auth/decorators/is-public.decorator';
import { OlxReceiveLeadDto } from './dto/receive-lead.dto';

@ApiTags('Chat')
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('numero-whatsapp-disponivel')
  async whatsappDisponivel(
    @LojaId() idLoja: string,
    @Query() query: { numero: string },
  ) {
    return await this.chatService.whatsappDisponivel(idLoja, query.numero);
  }

  @Get('buscar-contato-por-numero')
  async buscarContatoPorNumero(
    @LojaId() idLoja: string,
    @Query() query: { numero: string },
  ) {
    return await this.chatService.buscarContatoPorNumero(idLoja, query.numero);
  }

  @Post('novo-chat')
  @UseGuards(JwtAuthGuard, AssinaturaGuard)
  async criarChat(
    @LojaId() idLoja: string,
    @UsuarioId() idUsuario: string,
    @Body() params: EnviarMensagemDto,
    @Query()
    query: {
      tipoCliente: 'cliente' | 'temporario';
      idCliente?: string;
      nome?: string;
      celular?: string;
    },
  ) {
    return await this.chatService.novoChat({
      idLoja,
      idUsuario,
      mensagem: params,
      idCliente: query.idCliente,
      tipoCliente: query.tipoCliente,
      nome: query.nome,
      celular: query.celular,
    });
  }

  @Put('/mensagem/:mensagemId/lida')
  async mensagemLida(
    @Param('mensagemId') mensagemId: string,
    @LojaId() idLoja: string,
  ) {
    return await this.chatService.marcarMensagemLida(idLoja, mensagemId);
  }

  @Put('/:chatId/marcar-lido')
  async marcarChatLido(
    @Param('chatId') chatId: string,
    @LojaId() idLoja: string,
  ) {
    return await this.chatService.marcarChatLido(idLoja, chatId);
  }

  @enviarMensagemDocs()
  @UseGuards(JwtAuthGuard, AssinaturaGuard)
  @Post('enviar-mensagem/:idChat')
  async enviarMensagem(
    @Param('idChat') idChat: string,
    @LojaId() idLoja: string,
    @UsuarioId() idUsuario: string,
    @Body() enviarMensagemDto: EnviarMensagemDto,
  ) {
    return await this.chatService.enviarMensagem(
      idChat,
      idLoja,
      idUsuario,
      enviarMensagemDto,
    );
  }

  @listarMensagensChatDocs()
  @Get('mensagens/:idChat')
  async buscarMensagens(
    @Param('idChat') idChat: string,
    @Query() params: FiltrosRotasListagem,
    @UsuarioId() idUsuario: string,
    @LojaId() idLoja: string,
  ) {
    return await this.chatService.buscarMensagensChat(idLoja, idChat, params);
  }

  @Get('mensagem/:messageId')
  async buscarMensagem(
    @Param('messageId') messageId: string,
    @LojaId() idLoja: string,
  ) {
    return await this.chatService.buscarMensagemPorId(messageId, idLoja);
  }

  @Get('mensagem/:messageId/pagina')
  async encontrarPaginaMensagem(
    @Param('messageId') messageId: string,
    @LojaId() idLoja: string,
    @Query('quantidade') quantidade?: string,
  ) {
    const qtd = quantidade ? +quantidade : 10;
    return await this.chatService.encontrarPaginaMensagem(messageId, idLoja, qtd);
  }

  @listarChatsDocs()
  @Get('listar-chats')
  async listarChats(
    @LojaId() idLoja: string,
    @Query() params: FiltrosRotasListagem,
    @UsuarioId() idUsuario: string,
  ) {
    return await this.chatService.listarChats(idLoja, idUsuario, params);
  }

  @Get('listar-chats-arquivados')
  async listarChatsArquivados(
    @LojaId() idLoja: string,
    @Query() params: FiltrosRotasListagem,
    @UsuarioId() idUsuario: string,
  ) {
    return await this.chatService.listarChatsArquivados(idLoja, idUsuario, params);
  }

  @UseInterceptors(AnyFilesInterceptor())
  @UseGuards(JwtAuthGuard, AssinaturaGuard)
  @Post('gerar-anexo/:idChat')
  async gerarAnexo(
    @UploadedFiles() arquivos: Express.Multer.File[],
    @Param('idChat') idChat: string,
  ) {
    return await this.chatService.gerarAnexo(arquivos, idChat);
  }

  @Get('/:idChat')
  async obterChat(
    @Param('idChat') idChat: string,
    @LojaId() idLoja: string,
    @UsuarioId() idUsuario: string,
  ) {
    return await this.chatService.pegarChat(idChat, idLoja);
  }

  @alterarAtendimentoChatDoc()
  @Put('/:idChat/alterar-atendimento/:idAtendimento')
  async alterarAtendimento(
    @Param('idChat') idChat: string,
    @Param('idAtendimento') idAtendimento: string,
    @LojaId() idLoja: string,
  ) {
    return await this.chatService.alterarAtendimento({
      idChat,
      idAtendimento,
      idLoja,
    });
  }

  @arquivarChatDocs()
  @Put('/:idChat/arquivar')
  async arquivarChat(
    @Param('idChat') idChat: string,
    @LojaId() idLoja: string,
  ) {
    return await this.chatService.alterarStatusArquivamento(idChat, idLoja, true);
  }

  @desarquivarChatDocs()
  @Put('/:idChat/desarquivar')
  async desarquivarChat(
    @Param('idChat') idChat: string,
    @LojaId() idLoja: string,
  ) {
    return await this.chatService.alterarStatusArquivamento(idChat, idLoja, false);
  }

  @IsPublic()
  @Post('/lead/receive')
  async receiveLead(@Body() payload: OlxReceiveLeadDto) {
    return await this.chatService.receiveLead(payload);
  }
}
