import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';

class ContagemOrigemAtendimentos {
  @ApiProperty({ example: 3 })
  anuncios: number;

  @ApiProperty({ example: 2 })
  loja: number;

  @ApiProperty({ example: 5 })
  redesSociais: number;

  @ApiProperty({ example: 1 })
  midiaFisica: number;

  @ApiProperty({ example: 0 })
  outros: number;
}

export class ItemOrigemAtendimentos {
  @ApiProperty({ example: '2024-10-01' })
  data: string;

  @ApiProperty({ type: ContagemOrigemAtendimentos })
  contagem: ContagemOrigemAtendimentos;
}

class PegarOrigemAtendimentosResponse {
  @ApiProperty({ example: 'diario' })
  agrupamento: string;

  @ApiProperty({ example: '2024-10-01' })
  dataInicio: string;

  @ApiProperty({ example: '2024-10-01' })
  dataFim: string;

  @ApiProperty({ type: [ItemOrigemAtendimentos] })
  dados: ItemOrigemAtendimentos[];
}

export class PegarOrigemAtendimentosSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string = 'Operação realizada com sucesso';

  @ApiProperty({ example: HttpStatus.OK })
  statusCode: number = HttpStatus.OK;

  @ApiProperty({ type: PegarOrigemAtendimentosResponse })
  data: PegarOrigemAtendimentosResponse;
}
