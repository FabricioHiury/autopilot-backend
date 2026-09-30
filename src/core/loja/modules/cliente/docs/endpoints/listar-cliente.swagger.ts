import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { CriarClienteSaidaDto } from './criar-cliente.swagger';

export class ClienteDaListaSaidaDto extends CriarClienteSaidaDto {}

export class ListarClienteSaidaDto {
  @ApiProperty({ example: 'Lucas' })
  pesquisa: string;

  @ApiProperty({ example: 1 })
  pagina: number;

  @ApiProperty({ example: '2024-08-26T21:24:04.855Z' })
  dataInicial: Date;

  @ApiProperty({ example: '2024-08-26T21:24:04.855Z' })
  dataFinal: Date;

  @ApiProperty({ example: 1 })
  quantidade: number;

  @ApiProperty({ example: 1 })
  totalClientes: number;

  @ApiProperty({ example: 1 })
  totalPaginas: number;

  @ApiProperty({ type: [ClienteDaListaSaidaDto] })
  clientes: ClienteDaListaSaidaDto[];
}

export class ListarClienteSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.OK] })
  statusCode: number;

  @ApiProperty()
  data: ListarClienteSaidaDto;
}

export class ListarClienteNotFound {
  @ApiProperty({ example: 'Erro ao encontrar uma loja com o ID informado.' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.NOT_FOUND] })
  statusCode: number;

  @ApiProperty()
  data: {};
}
