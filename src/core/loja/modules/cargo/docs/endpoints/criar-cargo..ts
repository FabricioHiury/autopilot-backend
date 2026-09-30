import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class CriarCargoSaida {
  @ApiProperty({
    example: 7,
  })
  id: string;

  @ApiProperty({
    example: 1,
  })
  idLoja: string;

  @ApiProperty({ example: 'Vendedor' })
  cargo: string;

  @ApiProperty({
    example: 'lojaCadastrarEditarClientes,lojaPesquisarClientes',
  })
  funcionalidades: string;
}

export class CriarCargoSucesso {
  @ApiProperty({ example: 'Cargo criado com sucesso' })
  message: string;

  @ApiProperty({ example: HttpStatus.OK })
  status: number;

  @ApiProperty({ type: CriarCargoSaida })
  data: CriarCargoSaida;
}
