import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

class Dados {
  @ApiProperty({ example: 50000, description: 'Em R$' })
  receita: number;

  @ApiProperty({ example: 20, description: 'Percentual' })
  taxaChurn: number;
}

class ReceitaTaxaChurnSaida {
  @ApiProperty({ example: '2024-09-01T00:00:00Z' })
  dataInicial: string;

  @ApiProperty({ example: '2024-09-30T23:59:59Z' })
  dataFinal: string;

  @ApiProperty({ type: () => Dados })
  dados: Dados;
}

export class ObterReceitaETaxaChurnSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string;

  @ApiProperty({ example: HttpStatus.OK })
  statusCode: number;

  @ApiProperty({ type: ReceitaTaxaChurnSaida })
  data: ReceitaTaxaChurnSaida;
}
