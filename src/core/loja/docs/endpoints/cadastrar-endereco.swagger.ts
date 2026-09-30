import { HttpStatus } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadosBrasileirosEnum } from 'src/utils/enum/estados.enum';

export class EnderecoLojaSaida {
  @ApiProperty({ example: 2 })
  id: string;

  @ApiProperty({ example: 1 })
  idLoja: string;

  @ApiProperty({ example: '12345-678' })
  cep: string;

  @ApiProperty({ example: 'SP', enum: EstadosBrasileirosEnum })
  uf: EstadosBrasileirosEnum;

  @ApiProperty({ example: 'São Paulo' })
  cidade: string;

  @ApiProperty({ example: 'Rua Exemplo' })
  rua: string;

  @ApiProperty({ example: '1000' })
  numero: string;

  @ApiPropertyOptional({ example: 'Bairro', nullable: true })
  bairro?: string;

  @ApiPropertyOptional({ example: 'Loja D', nullable: true })
  complemento?: string;

  @ApiProperty({ example: false })
  filial: boolean;

  @ApiProperty({ example: '2024-12-17T19:05:02.498Z' })
  criadoEm: string;

  @ApiProperty({ example: '2024-12-17T19:09:32.446Z' })
  atualizadoEm: string;
}

export class CadastrarEnderecoLojaSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string;

  @ApiProperty({ example: HttpStatus.CREATED })
  statusCode: number;

  @ApiProperty({ type: EnderecoLojaSaida })
  data: EnderecoLojaSaida;
}
