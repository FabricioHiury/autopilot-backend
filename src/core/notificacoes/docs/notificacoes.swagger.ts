import { HttpStatus, applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ListarNotificacoesSucesso } from './endpoints/listar-notificacoes.swagger';
import { AlterarStatusSucesso } from './endpoints/alterar-status.swagger';
import { AlterarStatusNotificacaoDto } from '../dto/notificacoes.dto';

export function ListarNotificacoesDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Listar Notificações',
      description:"Lista notificações do usuário atual logado"
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: ListarNotificacoesSucesso,
    }),
  );
}

export function AlterarStatusNotificacaoDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Alterar Status',
    }),
    ApiBody({
      type:AlterarStatusNotificacaoDto,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: AlterarStatusSucesso,
    }),
  );
}
