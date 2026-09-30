import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

class Cliente {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 'Carros Corp.' })
  nome: string;

  @ApiProperty({ example: '999999999999999999' })
  cnpj: string;

  @ApiProperty({ example: 2000 })
  totalGasto: number;

  @ApiProperty({ example: 4 })
  frequencia: number;

  @ApiProperty({ example: '4 meses' })
  duracao: string;

  @ApiProperty({ example: 8000 })
  clv: number;
}

class VidaUtilClientesSaida {
  @ApiProperty({ example: 1 })
  pagina: number;

  @ApiProperty({ example: 10 })
  itensPorPagina: number;

  @ApiProperty({ example: 1 })
  totalPaginas: number;

  @ApiProperty({ example: '' })
  pesquisa: string;

  @ApiProperty({ type: [Cliente] })
  clientes: Cliente[];
}

export class ObterVidaUtilClientesSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string;

  @ApiProperty({ example: HttpStatus.OK })
  statusCode: number;

  @ApiProperty({ type: VidaUtilClientesSaida })
  data: VidaUtilClientesSaida;
}
