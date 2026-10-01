import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { GetCustomerOutputDto } from './get-customer.swagger';

export class EditCustomerOutputDto extends GetCustomerOutputDto {}

export class EditCustomerSuccess {
  @ApiProperty({ example: 'Operation completed with success' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.OK] })
  statusCode: number;

  @ApiProperty()
  data: EditCustomerOutputDto;
}

export class EditCustomerNotFound {
  @ApiProperty({ example: 'None customer with this ID was found.' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.NOT_FOUND] })
  statusCode: number;

  @ApiProperty()
  data: {};
}

export class EditCustomerConflict {
  @ApiProperty({
    example:
      'There is already a customer with this address of email registered.',
  })
  message: string;

  @ApiProperty({ examples: [HttpStatus.NOT_FOUND] })
  statusCode: number;

  @ApiProperty()
  data: {};
}
