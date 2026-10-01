import { HttpStatus, applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ListIntegrationsSuccess } from './endpoints/list-integrations.swagger';
import { StatusIntegrationsSuccess } from './endpoints/status-integrations.swagger';
import { OlxLinkRedirectSuccess } from './endpoints/olx-link-redirect.swagger';
import { IntegrateWhatsAppSuccess } from './endpoints/integrate-whatsapp.swagger';
import { IntegrateInstagramSuccess } from './endpoints/integrate-instagram.swagger';
import { IntegrateFacebookSuccess } from './endpoints/integrate-facebook.swagger';
import { IntegrateOlxSuccess } from './endpoints/integrate-olx.swagger';

const description = '';

export function OlxLinkRedirectDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Olx link redirecionamento',
      description,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: OlxLinkRedirectSuccess,
    }),
  );
}

export function ListIntegrationsDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Listing of integrations',
      description,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: ListIntegrationsSuccess,
    }),
  );
}

export function StatusIntegrationsDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Status of integrations',
      description,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: StatusIntegrationsSuccess,
    }),
  );
}

export function IntegrateWhatsAppDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Returns o QR code for integration with o WhatsApp.',
      description:
        'It is necessary to that o administrator autopilot configure a instance of store for get o QR code. (field wppConfigured = true)',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: IntegrateWhatsAppSuccess,
    }),
  );
}

export function IntegrateInstagramDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Integrate Instagram',
      description,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: IntegrateInstagramSuccess,
    }),
  );
}

export function IntegrateFacebookDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Integrate Facebook',
      description,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: IntegrateFacebookSuccess,
    }),
  );
}

export function IntegrateOlxDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Integrate OLX',
      description,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: IntegrateOlxSuccess,
    }),
  );
}

export function RemoveOlxDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Remove integration OLX',
      description:
        'Desativa o webhook of recebimento of messages of integration with a OLX',
    }),
    ApiResponse({
      status: HttpStatus.OK,
    }),
  );
}
