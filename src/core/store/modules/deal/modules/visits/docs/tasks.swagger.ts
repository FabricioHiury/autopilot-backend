import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateVisitDto } from '../dto/create-visit.dto';
import {
  CreateTaskNotFound,
  CreateTaskSuccess,
} from './endpoints/create-task.swagger';
import {
  GetTaskNotFound,
  GetTaskSuccess,
} from './endpoints/get-terefa.swagger';
import {
  ListTasksNotFound,
  ListTasksSuccess,
} from './endpoints/list-tasks.swagger';
import {
  EditTaskNotFound,
  EditTaskSuccess,
} from './endpoints/edit-task.swagger';
import {
  UpdateStatusTaskNotFound,
  UpdateStatusTaskSuccess,
} from './endpoints/update-status-task.swagger';
import {
  DeleteTaskNotFound,
  DeleteTaskSuccess,
} from './endpoints/delete-task.swagger';

const description =
  'For access this endpoint, is required be authenticated with o profile of user or storeOwner.';

export function CreateTaskDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create task of antendimento',
      description,
    }),

    ApiBody({ type: CreateVisitDto }),

    ApiResponse({
      status: HttpStatus.CREATED,
      type: CreateTaskSuccess,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      type: CreateTaskNotFound,
    }),
  );
}

export function GetTaskDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get task of deal',
      description,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: GetTaskSuccess,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      type: GetTaskNotFound,
    }),
  );
}

export function ListTasksDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'List tasks of deal',
      description,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: ListTasksSuccess,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      type: ListTasksNotFound,
    }),
  );
}

export function EditTaskDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Edit task of deal',
      description,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: EditTaskSuccess,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      type: EditTaskNotFound,
    }),
  );
}

export function UpdateStatusTaskDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Altera o status of a task of deal',
      description: 'Toggles the task completion status. ' + description,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: UpdateStatusTaskSuccess,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      type: UpdateStatusTaskNotFound,
    }),
  );
}

export function DeleteTaskDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete task of deal',
      description,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: DeleteTaskSuccess,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      type: DeleteTaskNotFound,
    }),
  );
}
