import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CriarVisitaDto } from '../dto/criar-visita.dto';
import {
  CriarTarefaNotFound,
  CriarTarefaSucesso,
} from './endpoints/criar-tarefa.swagger';
import {
  PegarTarefaNotFound,
  PegarTarefaSucesso,
} from './endpoints/pegar-terefa.swagger';
import {
  ListarTarefasNotFound,
  ListarTarefasSucesso,
} from './endpoints/listar-tarefas.swagger';
import {
  EditarTarefaNotFound,
  EditarTarefaSucesso,
} from './endpoints/editar-tarefa.swagger';
import {
  AlterarStatusTarefaNotFound,
  AlterarStatusTarefaSucesso,
} from './endpoints/alterar-status-tarefa.swagger';
import {
  DeletarTarefaNotFound,
  DeletarTarefaSucesso,
} from './endpoints/deletar-tarefa.swagger';

const description =
  'Para acessar este endpoint, é necessário estar autenticado com o perfil de usuário ou lojista.';

export function CriarTarefaDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Criar tarefa do antendimento',
      description,
    }),

    ApiBody({ type: CriarVisitaDto }),

    ApiResponse({
      status: HttpStatus.CREATED,
      type: CriarTarefaSucesso,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      type: CriarTarefaNotFound,
    }),
  );
}

export function PegarTarefaDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Pegar tarefa do atendimento',
      description,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: PegarTarefaSucesso,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      type: PegarTarefaNotFound,
    }),
  );
}

export function ListarTarefasDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Listar tarefas do atendimento',
      description,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: ListarTarefasSucesso,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      type: ListarTarefasNotFound,
    }),
  );
}

export function EditarTarefaDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Editar tarefa do atendimento',
      description,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: EditarTarefaSucesso,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      type: EditarTarefaNotFound,
    }),
  );
}

export function AlterarStatusTarefaDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Altera o status de uma tarefa do atendimento',
      description:
        'Dá um toggle no status da tarefa, de concluída para não concluída e vice-versa. ' +
        description,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: AlterarStatusTarefaSucesso,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      type: AlterarStatusTarefaNotFound,
    }),
  );
}

export function DeletarTarefaDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Deletar tarefa do atendimento',
      description,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: DeletarTarefaSucesso,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      type: DeletarTarefaNotFound,
    }),
  );
}
