import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { PegarClienteSaidaDto } from './pegar-cliente.swagger';

export class EditarClienteSaidaDto extends PegarClienteSaidaDto {}

export class EditarClienteSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.OK] })
  statusCode: number;

  @ApiProperty()
  data: EditarClienteSaidaDto;
}

export class EditarClienteNotFound {
  @ApiProperty({ example: 'Nenhum cliente com este ID foi encontrado.' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.NOT_FOUND] })
  statusCode: number;

  @ApiProperty()
  data: {};
}

export class EditarClienteConflict {
  @ApiProperty({
    example: 'Já existe um cliente com este endereço de email cadastrado.',
  })
  message: string;

  @ApiProperty({ examples: [HttpStatus.NOT_FOUND] })
  statusCode: number;

  @ApiProperty()
  data: {};
}
