import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import {
  ErrorBadRequest,
  ErrorNotFound,
} from 'src/utils/errors/errors.swagger';
import { ListFaqReply } from './list-faqs.swagger';

export class GetFaqSuccess {
  @ApiProperty({ example: 'Operation completed with success' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.OK] })
  statusCode: number;

  @ApiProperty({ isArray: true })
  data: ListFaqReply;
}

export class GetFaqErrorBadRequest extends ErrorBadRequest {
  @ApiProperty({
    example: 'Parameters of query invalid',
  })
  message: string;
}

export class GetFaqErrorNotFound extends ErrorNotFound {
  @ApiProperty({
    example: 'FAQ not found',
  })
  message: string;
}
