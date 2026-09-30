import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class InativarClienteSaidaDto {
  @ApiProperty({ example: 'Cliente inativado com sucesso.' })
  message: string;
}

export class InativarClienteSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.OK] })
  statusCode: number;

  @ApiProperty()
  data: InativarClienteSaidaDto;
}

export class InativarClienteNotFound {
  @ApiProperty({
    example: 'Nenhum cliente com este ID foi encontrado nesta loja.',
  })
  message: string;

  @ApiProperty({ examples: [HttpStatus.NOT_FOUND] })
  statusCode: number;

  @ApiProperty()
  data: {};
}

export class InativarClienteConflict {
  @ApiProperty({
    example: 'Este cliente já está inativo.',
  })
  message: string;

  @ApiProperty({ examples: [HttpStatus.CONFLICT] })
  statusCode: number;

  @ApiProperty()
  data: {};
}
