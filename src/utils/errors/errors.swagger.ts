import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class ErrorBadRequest {
  @ApiProperty()
  message: string;

  @ApiProperty({ example: HttpStatus.BAD_REQUEST })
  statusCode: number;

  @ApiProperty()
  data: {};
}

export class ErrorUnauthorized {
  @ApiProperty()
  message: string;

  @ApiProperty({ example: HttpStatus.UNAUTHORIZED })
  statusCode: number;

  @ApiProperty()
  data: {};
}

export class ErrorNotFound {
  @ApiProperty()
  message: string;

  @ApiProperty({ example: HttpStatus.NOT_FOUND })
  statusCode: number;

  @ApiProperty()
  data: {};
}

export class ErrorConflict {
  @ApiProperty()
  message: string;

  @ApiProperty({ example: HttpStatus.CONFLICT })
  statusCode: number;

  @ApiProperty()
  data: {};
}
