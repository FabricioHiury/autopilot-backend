import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class AtivarClienteSaidaDto {
  @ApiProperty({ example: 'Cliente ativado com sucesso.' })
  message: string;
}

export class AtivarClienteSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.OK] })
  statusCode: number;

  @ApiProperty()
  data: AtivarClienteSaidaDto;
}

export class AtivarClienteNotFound {
  @ApiProperty({
    example: 'Nenhum cliente com este ID foi encontrado nesta loja.',
  })
  message: string;

  @ApiProperty({ examples: [HttpStatus.NOT_FOUND] })
  statusCode: number;

  @ApiProperty()
  data: {};
}

export class AtivarClienteConflict {
  @ApiProperty({
    example: 'Este cliente já está ativo.',
  })
  message: string;

  @ApiProperty({ examples: [HttpStatus.CONFLICT] })
  statusCode: number;

  @ApiProperty()
  data: {};
}
