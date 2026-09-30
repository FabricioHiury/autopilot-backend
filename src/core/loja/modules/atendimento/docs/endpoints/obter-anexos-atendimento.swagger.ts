import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

class AnexoFormatado {
  @ApiProperty({ example: 1 })
  idAnexo: string;

  @ApiProperty({ example: 'https://img.com' })
  url: string;
}

class ObterAnexosAtendimentoSaida {
  @ApiProperty({ example: 1 })
  pagina: number;

  @ApiProperty({ example: 10 })
  itensPagina: number;

  @ApiProperty({ example: 1 })
  totalPaginas: number;

  @ApiProperty({ type: [AnexoFormatado] })
  anexos: AnexoFormatado[];
}

export class ObterAnexosAtendimentoSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso.' })
  message: string;

  @ApiProperty({ example: HttpStatus.OK })
  statusCode: number;

  @ApiProperty({ type: ObterAnexosAtendimentoSaida })
  data: ObterAnexosAtendimentoSaida;
}
