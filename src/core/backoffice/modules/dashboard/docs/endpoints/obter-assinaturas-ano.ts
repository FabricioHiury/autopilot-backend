import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

class MesEstatisticas {
  @ApiProperty({ example: 'janeiro' })
  mes: string;

  @ApiProperty({ example: 0 })
  assinaturas: number;

  @ApiProperty({ example: 0 })
  cancelamentos: number;
}

class AnoEstatisticas {
  @ApiProperty({ example: '2024' })
  ano: string;

  @ApiProperty({ example: 1 })
  assinaturas: number;

  @ApiProperty({ example: 0 })
  cancelamentos: number;

  @ApiProperty({ type: [MesEstatisticas] })
  meses: MesEstatisticas[];
}

export class ObterAssinaturasAnoSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string;

  @ApiProperty({ example: HttpStatus.OK })
  statusCode: number;

  @ApiProperty({ type: AnoEstatisticas })
  data: AnoEstatisticas;
}
