import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

class Estatisticas {
  @ApiProperty({ example: 1 })
  novosCadastros: number;

  @ApiProperty({ example: 1 })
  novosUpgrades: number;

  @ApiProperty({ example: 1 })
  desativacoesConta: number;

  @ApiProperty({ example: 1 })
  cancelamentosPlano: number;
}

class EstatisticasCadastrosSaida {
  @ApiProperty({ example: '2024-09-01T00:00:00Z' })
  dataInicial: string;

  @ApiProperty({ example: '2024-09-30T23:59:59Z' })
  dataFinal: string;

  @ApiProperty({ type: () => Estatisticas })
  estatisticas: Estatisticas;
}

export class ObterEstatisticasCadastrosSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string;

  @ApiProperty({ example: HttpStatus.OK })
  statusCode: number;

  @ApiProperty({ type: EstatisticasCadastrosSaida })
  data: EstatisticasCadastrosSaida;
}
