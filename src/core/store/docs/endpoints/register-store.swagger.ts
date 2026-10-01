import { HttpStatus } from '@nestjs/common';
import { ApiBody, ApiProperty } from '@nestjs/swagger';

export class RegisterStoreSuccess {
  @ApiProperty({ example: 'Operation completed with success' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.OK] })
  statusCode: number;

  @ApiProperty()
  data: {};
}

export class RegisterStoreMaRequest {
  @ApiProperty({
    example: 'Invalid store owner registration: check email and tax ID',
  })
  message: string;

  @ApiProperty({ examples: [HttpStatus.CONFLICT] })
  statusCode: number;

  @ApiProperty()
  data: {};
}

export class RegisterStoreConflict {
  @ApiProperty({ example: 'Conflict of data detected' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.CONFLICT] })
  statusCode: number;

  @ApiProperty()
  data: {};
}
