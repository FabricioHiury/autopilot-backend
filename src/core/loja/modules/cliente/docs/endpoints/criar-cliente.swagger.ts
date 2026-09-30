import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { ClienteEnderecoDto } from '../../dto/cliente.dto';

export class CriarClienteSaidaDto {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 1 })
  idLoja: string;

  @ApiProperty({ example: 1 })
  idFoto: string;

  @ApiProperty({ example: 'Lucas Roque' })
  nome: string;

  @ApiProperty({ example: 'fisica' })
  tipoPessoa: string;

  @ApiProperty({ example: '35430843725' })
  documentoFiscal: string;

  @ApiProperty({ example: '123456789' })
  rg: string;

  @ApiProperty({ example: false })
  estrangeiro: boolean;

  @ApiProperty({ example: 'masculino' })
  genero: string;

  @ApiProperty({ example: 'ativo' })
  status: string;

  @ApiProperty({ example: '2000-12-20T00:00:00.000Z' })
  dataNascimento: string;

  @ApiProperty({ example: 'Observações' })
  observacoes: string;

  @ApiProperty({ example: '(12) 91234-5678' })
  telefone: string;

  @ApiProperty({ example: '(12) 91234-5678' })
  whatsapp: string;

  @ApiProperty({ example: 'lucas@email.com' })
  email: string;

  @ApiProperty({ example: 1 })
  versao: string;

  @ApiProperty({ example: '2024-08-26T21:24:04.855Z' })
  criadoEm: Date;

  @ApiProperty({ example: '2024-08-26T21:24:04.855Z' })
  atualizadoEm: Date;

  @ApiProperty()
  enderecoCliente: ClienteEnderecoDto;

  @ApiProperty({ example: 1 })
  totalAtendimentos: number;
}

export class CriarClienteSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.OK] })
  statusCode: number;

  @ApiProperty()
  data: CriarClienteSaidaDto;
}

export class CriarClienteConflict {
  @ApiProperty({
    example: 'Já existe um cliente cadastrado com este CPF ou CNPJ nesta loja.',
  })
  message: string;

  @ApiProperty({ examples: [HttpStatus.CONFLICT] })
  statusCode: number;

  @ApiProperty()
  data: {};
}

export class CriarClienteNotFound {
  @ApiProperty({ example: 'Erro ao encontrar uma loja com o ID informado.' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.NOT_FOUND] })
  statusCode: number;

  @ApiProperty()
  data: {};
}
