import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateFaqDto } from '../dto/create-faq.dto';
import {
  CreateFaqBadRequest,
  CreateFaqSuccess,
} from './endpoints/create-faq.swagger';
import {
  ListFaqsErrorBadRequest,
  ListFaqSuccess,
} from './endpoints/list-faqs.swagger';
import {
  GetFaqErrorBadRequest,
  GetFaqErrorNotFound,
  GetFaqSuccess,
} from './endpoints/get-faq-id.swagger';

export function createFaqDoc() {
  const description = '';
  return applyDecorators(
    ApiOperation({
      summary: 'Create | Edit FAQ',
    }),

    ApiBody({ type: CreateFaqDto }),

    ApiResponse({
      status: HttpStatus.OK,
      type: CreateFaqSuccess,
    }),

    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      type: CreateFaqBadRequest,
    }),
  );
}

export function listFaqDoc() {
  const description = '';
  return applyDecorators(
    ApiOperation({
      summary: 'List FAQs',
      description,
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Number of page',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Limit of results',
    }),
    ApiQuery({
      name: 'search',
      required: false,
      type: String,
      description: 'Text for search',
    }),
    ApiQuery({
      name: 'tags',
      required: false,
      type: String,
      description: 'names of tags separated by comma(ex: new,deal,duvida)',
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: ListFaqSuccess,
    }),

    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      type: ListFaqsErrorBadRequest,
    }),
  );
}

export function GetFaqByIdDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get FAQ by ID',
    }),
    ApiParam({
      name: 'id',
      type: Number,
      description: 'ID of faq',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: GetFaqSuccess,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      type: GetFaqErrorBadRequest,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      type: GetFaqErrorNotFound,
    }),
  );
}

export function GetFaqBySlugDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get FAQ by Slug',
    }),
    ApiParam({
      name: 'slug',
      type: String,
      description: 'Slug of faq',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: GetFaqSuccess,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      type: GetFaqErrorBadRequest,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      type: GetFaqErrorNotFound,
    }),
  );
}

export function CountViewsDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Count views FAQ',
    }),
    ApiHeader({
      name: 'x-api-guard',
      description: 'x-api-guard for poder access a rota',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: GetFaqSuccess,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      type: GetFaqErrorBadRequest,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      type: GetFaqErrorNotFound,
    }),
  );
}

export function DeleteFaqDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete FAQ',
    }),

    ApiParam({
      name: 'id',
      type: Number,
      description: 'ID of faq',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: GetFaqSuccess,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      type: GetFaqErrorNotFound,
    }),
  );
}
