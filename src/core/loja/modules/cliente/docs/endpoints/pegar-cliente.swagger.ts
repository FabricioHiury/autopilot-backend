import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { ClienteEnderecoDto } from '../../dto/cliente.dto';

class LogsAtividadesAtendimento {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 1 })
  idAtendimento: string;

  @ApiProperty({
    example: `Jorge mudou o status do atendimento para "concluído"`,
  })
  mensagem: string;

  @ApiProperty({ example: '2024-08-26T21:24:04.855Z' })
  criadoEm: string;
}

export class AtendimentoClienteSaidaDto {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 1 })
  idCliente: string;

  @ApiProperty({ example: 1 })
  idClienteTemporario: string;

  @ApiProperty({ example: 'instagram' })
  origemAtendimento: string;

  @ApiProperty({ example: 'quente' })
  temperatura: string;

  @ApiProperty({ example: 'compra' })
  modo: string;

  @ApiProperty({ example: 'ativo' })
  status: string;

  @ApiProperty({ example: 'descricao' })
  descricaoAtendimento: string;

  @ApiProperty({ example: 'observacao' })
  observacao: string;

  @ApiProperty({ example: '2024-08-26T21:24:04.855Z' })
  criadoEm: string;

  @ApiProperty({ example: '2024-08-26T21:24:04.855Z' })
  atualizadoEm: string;

  @ApiProperty({ type: [LogsAtividadesAtendimento] })
  logsAtividadesAtendimento: LogsAtividadesAtendimento[];
}

export class PegarClienteSaidaDto {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 1 })
  idLoja: string;

  @ApiProperty({ example: 1 })
  idFoto: string;

  @ApiProperty({ example: 'Lucas da Silva' })
  nome: string;

  @ApiProperty({ example: 'fisica' })
  tipoPessoa: string;

  @ApiProperty({ example: '35430843725' })
  documentoFiscal: string;

  @ApiProperty({ example: '123456789' })
  rg: string;

  @ApiProperty({ example: false })
  estrangeiro: boolean;

  @ApiProperty({ example: 'Masculino' })
  genero: string;

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

  @ApiProperty({ example: '2024-08-26T21:24:04.855Z' })
  criadoEm: string;

  @ApiProperty({ example: '2024-08-26T21:24:04.855Z' })
  atualizadoEm: string;

  @ApiProperty()
  enderecoCliente: ClienteEnderecoDto;


  @ApiProperty()
  usuarioCriador: {
    nome:string,
    id:number,
    perfil:string
  };


  @ApiProperty({ isArray: true })
  atendimentos: AtendimentoClienteSaidaDto[];

  @ApiProperty({ example: 1 })
  totalAtendimentos: number;
}

export class PegarClienteSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.OK] })
  statusCode: number;

  @ApiProperty()
  data: PegarClienteSaidaDto;
}

export class PegarClienteNotFound {
  @ApiProperty({
    example: 'Nenhum cliente com este ID foi encontrado nesta loja.',
  })
  message: string;

  @ApiProperty({ examples: [HttpStatus.NOT_FOUND] })
  statusCode: number;

  @ApiProperty()
  data: {};
}
