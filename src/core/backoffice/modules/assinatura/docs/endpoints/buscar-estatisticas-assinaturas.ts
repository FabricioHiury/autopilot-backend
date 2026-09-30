import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

class Plano {
  @ApiProperty({ example: 'premium' })
  plano: string;

  @ApiProperty({ example: 1 })
  total: number;

  @ApiProperty({ example: 33 })
  percentual: number;
}

class EstatisticasAssinaturas {
  @ApiProperty({ example: 3 })
  totalAssinaturas: number;

  @ApiProperty({ type: [Plano] })
  planos: Plano[];
}

export class BuscarEstatisticasAssinaturasSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string;

  @ApiProperty({ example: HttpStatus.OK })
  statusCode: number;

  @ApiProperty({ type: EstatisticasAssinaturas })
  data: EstatisticasAssinaturas;
}
