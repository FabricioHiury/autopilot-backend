import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { CriarCargoSaida } from './criar-cargo.';

export class DeletarCargoSucesso {
  @ApiProperty({ example: 'Cargo criado com sucesso' })
  message: string;

  @ApiProperty({ example: HttpStatus.OK })
  status: number;

  @ApiProperty({ type: CriarCargoSaida })
  data: CriarCargoSaida;
}
