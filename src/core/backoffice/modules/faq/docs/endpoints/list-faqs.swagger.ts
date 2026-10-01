import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { ErrorBadRequest } from 'src/utils/errors/errors.swagger';

export class ListFaqReply {
  @ApiProperty({ example: 55 })
  id: string;

  @ApiProperty({ example: 'You have problem in version 2' })
  title: string;

  @ApiProperty({ example: 'contas' })
  category: string;

  @ApiProperty({ example: 'published' })
  status: string;

  @ApiProperty({
    example: 'Buying a vehicle requires planning and research.',
  })
  summary: string;

  @ApiProperty({ example: 0 })
  views: number;

  @ApiProperty({ example: '2024-12-04T23:45:05.442Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-12-04T23:45:05.442Z' })
  updatedAt: Date;

  @ApiProperty({ example: ['new', 'vehicle', 'BUY'] })
  tags: string[];
}

export class ListFaqSuccess {
  @ApiProperty({ example: 'Operation completed with success' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.OK] })
  statusCode: number;

  @ApiProperty({})
  data: ListFaqReply;
}

export class ListFaqsErrorBadRequest extends ErrorBadRequest {
  @ApiProperty({
    example: 'Parameters of query invalid',
  })
  message: string;
}
