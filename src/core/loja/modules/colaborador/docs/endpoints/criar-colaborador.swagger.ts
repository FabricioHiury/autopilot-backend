import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';


class EnderecoCliente {
  @ApiProperty({ example: 2 })
  id: string;

  @ApiProperty({ example: 2 })
  idCliente: string;

  @ApiProperty({ example: '12345678' })
  cep: string;

  @ApiProperty({ example: 'sp' })
  uf: string;

  @ApiProperty({ example: 'São Paulo' })
  municipio: string;

  @ApiProperty({ example: 'Rua das Flores' })
  endereco: string;

  @ApiProperty({ example: 'Bairro das Flores' })
  bairro: string;

  @ApiProperty({ example: '123' })
  numero: string;

  @ApiProperty({ example: 'Complemento' })
  complemento: string;

  @ApiProperty({ example: '2024-10-03T16:39:02.820Z' })
  criadoEm: string;

  @ApiProperty({ example: '2024-10-03T16:39:02.820Z' })
  atualizadoEm: string;
}

class Funcionalidades {
  @ApiProperty({ example: ['lojaVerDashboard', 'lojaVerAtendimentos'] })
  funcionalidades: string[];
}

class CriarColaboradorResponse {
  @ApiProperty({ example: 2 })
  id: string;


  @ApiProperty({ example: 5 })
  idUsuario: string;

  @ApiProperty({ example: 1 })
  idLoja: string;

  @ApiProperty({ example: null })
  idFoto: string | null;

  @ApiProperty({ example: 'Jose da Silva' })
  nome: string;

  @ApiProperty({ example: 'fisica' })
  tipoPessoa: string;

  @ApiProperty({ example: '1222345678910' })
  documentoFiscal: string;

  @ApiProperty({ example: '123456789' })
  rg: string;

  @ApiProperty({ example: false })
  estrangeiro: boolean;

  @ApiProperty({ example: 'masculino' })
  genero: string;

  @ApiProperty({ example: 'ativo' })
  status: string;

  @ApiProperty({ example: '2024-12-20T00:00:00.000Z' })
  dataNascimento: string;

  @ApiProperty({ example: null })
  observacoes: string | null;

  @ApiProperty({ example: '18996496211' })
  telefone: string;

  @ApiProperty({ example: '18996496211' })
  whatsapp: string;

  @ApiProperty({ example: 'emailtesteasa@email.com' })
  email: string;

  @ApiProperty({ example: '2024-10-03T16:39:02.820Z' })
  criadoEm: string;

  @ApiProperty({ example: '2024-10-03T16:39:02.820Z' })
  atualizadoEm: string;

  @ApiProperty({ type: EnderecoCliente })
  enderecoCliente: EnderecoCliente;

  @ApiProperty({ type: [String], example: ['lojaVerDashboard', 'lojaVerAtendimentos'] })
  funcionalidades: string[];
}

export class CriarColaboradorSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string;

  @ApiProperty({ example: HttpStatus.CREATED })
  statusCode: number;

  @ApiProperty({ type: CriarColaboradorResponse })
  data: CriarColaboradorResponse;
}

export class CriarColaboradorBadRequest {
  @ApiProperty({ example: 'Erro ao realizar a operação'})
  message: string;

  @ApiProperty( { example: HttpStatus.BAD_REQUEST})
  statusCode: number;

  @ApiProperty({})
  data: {}
}