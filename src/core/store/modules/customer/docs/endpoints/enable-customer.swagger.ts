import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class EnableCustomerOutputDto {
  @ApiProperty({ example: 'Customer ativado with success.' })
  message: string;
}

export class EnableCustomerSuccess {
  @ApiProperty({ example: 'Operation completed with success' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.OK] })
  statusCode: number;

  @ApiProperty()
  data: EnableCustomerOutputDto;
}

export class EnableCustomerNotFound {
  @ApiProperty({
    example: 'None customer with this ID was found this store.',
  })
  message: string;

  @ApiProperty({ examples: [HttpStatus.NOT_FOUND] })
  statusCode: number;

  @ApiProperty()
  data: {};
}

export class EnableCustomerConflict {
  @ApiProperty({
    example: 'This customer already is active.',
  })
  message: string;

  @ApiProperty({ examples: [HttpStatus.CONFLICT] })
  statusCode: number;

  @ApiProperty()
  data: {};
}
