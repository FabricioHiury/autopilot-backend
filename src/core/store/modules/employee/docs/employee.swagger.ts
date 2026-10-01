import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { CreateEmployeeDto, EditEmployeeDto } from '../dto/employee.dto';
import {
  CreateEmployeeBadRequest,
  CreateEmployeeSuccess,
} from './endpoints/create-employee.swagger';
import {
  AppErrorBadRequest,
  AppErrorNotFound,
} from 'src/utils/errors/app-errors';
import {
  EditEmployeeBadRequest,
  EditEmployeeSuccess,
} from './endpoints/edit-employee.swagger';
import {
  FindEmployeeError,
  FindEmployeeSuccess,
} from './endpoints/find-employee.swagger';
import {
  FindEmployeesError,
  FindEmployeesSuccess,
} from './endpoints/find-all-employees.swagger';

const description =
  'For access these endpoints, is required be authenticated with o profile of storeOwner.';

export function createEmployeeDoc() {
  return applyDecorators(
    ApiOperation({ summary: 'Creation of a new employee' }),
    ApiBody({ type: CreateEmployeeDto }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Employee created with success.',
      type: CreateEmployeeSuccess,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Request invalid.',
      type: CreateEmployeeBadRequest,
    }),
  );
}

export function editEmployeeDoc() {
  return applyDecorators(
    ApiOperation({ summary: 'Edit the information of a employee' }),
    ApiBody({ type: EditEmployeeDto }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Operation completed successfully.',
      type: EditEmployeeSuccess,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Failed to perform a operation',
      type: EditEmployeeBadRequest,
    }),
  );
}

export function findEmployeeDoc() {
  return applyDecorators(
    ApiOperation({ summary: 'Find information of a employee' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Operation completed with success',
      type: FindEmployeeSuccess,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Employee not found.',
      type: FindEmployeeError,
    }),
  );
}

export function findAllEmployeesDoc() {
  return applyDecorators(
    ApiOperation({ summary: 'Find information of all employees' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Operation completed with success',
      type: FindEmployeesSuccess,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Employee not found.',
      type: FindEmployeesError,
    }),
  );
}

export function editEmployeesDoc() {
  return applyDecorators(
    ApiOperation({ summary: 'Edit information of a employee' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Operation completed with success',
      type: FindEmployeeSuccess,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Employee not found.',
      type: FindEmployeeError,
    }),
  );
}
