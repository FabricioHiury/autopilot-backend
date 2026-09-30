import { ApiProperty } from '@nestjs/swagger';
import { CadastroEnderecoDto, EditarContatoDto } from '../loja.dto';
import { TIPOS_PLANO } from 'src/utils/enum/planos.enum';

export class LojistaSaidaDto {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 'Fulano Oliveira' })
  nome: string;
}

export class MeuPlanoDto {
  @ApiProperty({
    description: 'ID da assinatura',
    example: 3,
  })
  id: string;
  @ApiProperty({
    description: 'ID da assinatura no Stripe',
    example: 3,
  })
  idAssinaturaStripe: string;

  @ApiProperty({
    description: 'Plano da assinatura',
    example: TIPOS_PLANO.PREMIUM,
  })
  plano: TIPOS_PLANO;

  @ApiProperty({
    description: 'Status atual da assinatura',
    example: 'ATIVO',
  })
  status: string;

  @ApiProperty({
    description: 'Data de início da assinatura',
    example: '2024-09-26T23:07:17.575Z',
  })
  dataInicial: Date;

  @ApiProperty({
    description: 'Data final da assinatura',
    example: '2024-10-26T23:07:17.575Z',
  })
  dataFinal: Date;
}

export class UsuarioDto {
  @ApiProperty({ example: 'teste5@mail.com' })
  email: string;

  @ApiProperty({ example: 'teste' })
  nome: string;

  @ApiProperty({ example: '2024-09-25T11:36:08.973Z' })
  criadoEm: string;
}

export class LojistaDetalhesDto {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: true })
  status: boolean;

  @ApiProperty({ type: UsuarioDto })
  usuario: UsuarioDto;

  @ApiProperty({
    description: 'Dados da assinatura do lojista',
    type: MeuPlanoDto,
  })
  assinatura: MeuPlanoDto;
}

export class DetalhesLojaDto {
  @ApiProperty({
    description: 'Endereços da loja',
    type: CadastroEnderecoDto,
    isArray: true,
  })
  enderecoLoja: CadastroEnderecoDto[];

  @ApiProperty({
    description: 'Dados do lojista',
    type: LojistaDetalhesDto,
  })
  lojista: LojistaDetalhesDto;

  @ApiProperty({ example: 'Loja Exemplo' })
  nomeEmpresa: string;

  @ApiProperty({
    description: 'Responsáveis pelo atendimento',
    example: ['João', 'Maria'],
  })
  atendimentoResponsaveis: string[];

  @ApiProperty({ example: 'Atividade de Comércio Varejista' })
  atividadePrincipal: string;

  @ApiProperty({ example: '00.000.000/0000-00' })
  cnpj: string;

  @ApiProperty({
    description: 'Lista de colaboradores da loja',
    example: ['Colaborador 1', 'Colaborador 2'],
  })
  colaborador: string[];

  @ApiProperty({
    description: 'Informações de contato da loja',
    type: EditarContatoDto,
  })
  contatoLoja: EditarContatoDto;

  @ApiProperty({
    description: 'Descrição das atividades da loja',
    example: 'Descrição detalhada das atividades da loja',
  })
  descricaoAtividade: string;

  @ApiProperty({
    description: 'Inscrição Estadual',
    example: '1234567890',
  })
  inscricaoEstadual: string;

  @ApiProperty({
    description: 'Inscrição Municipal',
    example: '0987654321',
  })
  inscricaoMunicipal: string;

  @ApiProperty({
    description: 'Portal da empresa',
    example: 'www.lojaexemplo.com',
  })
  portalEmpresa: string;

  @ApiProperty({
    description: 'Regime Tributário da empresa',
    example: 'Simples Nacional',
  })
  regimeTributario: string;
}

export class DetalhesLojaListaDto {
  @ApiProperty({
    description: 'Endereços da loja',
    type: CadastroEnderecoDto,
    isArray: true,
  })
  enderecoLoja: CadastroEnderecoDto[];

  @ApiProperty({
    description: 'Dados do lojista',
    type: LojistaDetalhesDto,
  })
  lojista: LojistaDetalhesDto;

  @ApiProperty({ example: 'Loja Exemplo' })
  nomeEmpresa: string;

  @ApiProperty({ example: '00.000.000/0000-00' })
  cnpj: string;

  @ApiProperty({
    description: 'Informações de contato da loja',
    type: EditarContatoDto,
  })
  contatoLoja: EditarContatoDto;
}

export class ListarLojaSaidaDto {
  @ApiProperty({ example: 'Lucas' })
  pesquisa: string;

  @ApiProperty({ example: 1 })
  pagina: number;
  @ApiProperty({ example: 3 })
  totalPaginas: number;
  @ApiProperty({ example: 22 })
  totalLojas: number;
  @ApiProperty({ example: 10 })
  quantidade: number;

  @ApiProperty({ type: [DetalhesLojaListaDto] })
  lojas: [DetalhesLojaListaDto];
}
