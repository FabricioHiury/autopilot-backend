import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class DeactivateCustomerOutputDto {
  @ApiProperty({ example: 'Customer inativado with success.' })
  message: string;
}

export class DeactivateCustomerSuccess {
  @ApiProperty({ example: 'Operation completed with success' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.OK] })
  statusCode: number;

  @ApiProperty()
  data: DeactivateCustomerOutputDto;
}

export class DeactivateCustomerNotFound {
  @ApiProperty({
    example: 'None customer with this ID was found this store.',
  })
  message: string;

  @ApiProperty({ examples: [HttpStatus.NOT_FOUND] })
  statusCode: number;

  @ApiProperty()
  data: {};
}

export class DeactivateCustomerConflict {
  @ApiProperty({
    example: 'This customer already is inactive.',
  })
  message: string;

  @ApiProperty({ examples: [HttpStatus.CONFLICT] })
  statusCode: number;

  @ApiProperty()
  data: {};
}
