import { HttpStatus, applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ListarIntegracoesSucesso } from './endpoints/listar-integracoes.swagger';
import { StatusIntegracoesSucesso } from './endpoints/status-integracoes.swagger';
import { OlxLinkRedirectSucesso } from './endpoints/olx-link-redirect.swagger';
import { IntegrarWhatsAppSucesso } from './endpoints/integrar-whatsapp.swagger';
import { IntegrarInstagramSucesso } from './endpoints/integrar-instagram.swagger';
import { IntegrarFacebookSucesso } from './endpoints/integrar-facebook.swagger';
import { IntegrarOlxSucesso } from './endpoints/integrar-olx.swagger';

const description = '';

export function OlxLinkRedirectDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Olx link redirecionamento',
      description,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: OlxLinkRedirectSucesso,
    }),
  );
}

export function ListarIntegracoesDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Listagem de integrações',
      description,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: ListarIntegracoesSucesso,
    }),
  );
}

export function StatusIntegracoesDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Status das integrações',
      description,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: StatusIntegracoesSucesso,
    }),
  );
}

export function IntegrarWhatsAppDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Retorna o QR code para integração com o WhatsApp.',
      description:
        'É necessário que o administrador autopilot configure a instância da loja para obter o QR code. (campo wppConfigurado = true)',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: IntegrarWhatsAppSucesso,
    }),
  );
}

export function IntegrarInstagramDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Integrar Instagram',
      description,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: IntegrarInstagramSucesso,
    }),
  );
}

export function IntegrarFacebookDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Integrar Facebook',
      description,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: IntegrarFacebookSucesso,
    }),
  );
}

export function IntegrarOlxDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Integrar OLX',
      description,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: IntegrarOlxSucesso,
    }),
  );
}

export function RemoverOlxDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Remover integração OLX',
      description:
        'Desativa o webhook de recebimento de mensagens da integração com a OLX',
    }),
    ApiResponse({
      status: HttpStatus.OK,
    }),
  );
}
