import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ListarLojasAdminSucesso } from './endpoints/listar-lojas.swagger';
import { ConfigurarIntegracaoWppSucesso } from './endpoints/configurar-integracao-wpp.swagger';
import { ConfigurarIntegracaoWppDto } from '../dto/configurar-integracao-whatsapp.dto';

const description = `Necessário token de autenticação de um usuário com perfil "autopilot".`;

export function ListarLojasAdminDoc() {
  return applyDecorators(
    ApiOperation({
      summary: `Lista todas as lojas cadastradas`,
      description,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: ListarLojasAdminSucesso,
    }),
  );
}

export function ConfigurarIntegracaoWppDoc() {
  return applyDecorators(
    ApiOperation({
      summary: `Configura a integração com whatsapp para uma loja`,
      description:
        description +
        ' Após a configuração, a loja em questão fica liberada para obter o QR Code de autenticação e começar e enviar e receber mensagens',
    }),

    ApiBody({ type: ConfigurarIntegracaoWppDto }),

    ApiResponse({
      status: HttpStatus.OK,
      type: ConfigurarIntegracaoWppSucesso,
    }),

    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
    }),

    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
    }),

    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
    }),
  );
}
