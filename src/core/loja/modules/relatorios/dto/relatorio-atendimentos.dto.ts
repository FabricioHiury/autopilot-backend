import { IsDateString, IsOptional, IsEnum } from 'class-validator';
import { ORIGEM_ATENDIMENTO, MODO_ATENDIMENTO } from 'src/utils/enum/atendimento.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FiltroRelatorioDto {
  @ApiProperty({
    type: String,
    format: 'date',
    description: 'Data inicial no formato YYYY-MM-DD',
  })
  @IsDateString()
  dataInicio: string;

  @ApiProperty({
    type: String,
    format: 'date',
    description: 'Data final no formato YYYY-MM-DD',
  })
  @IsDateString()
  dataFim: string;

  @ApiPropertyOptional({
    type: String,
    description: 'ID do colaborador para filtrar',
  })
  @IsOptional()
  idColaborador?: string;

  @ApiPropertyOptional({
    enum: ORIGEM_ATENDIMENTO,
    description: 'Filtra por canal/origem do atendimento',
  })
  @IsOptional()
  @IsEnum(ORIGEM_ATENDIMENTO)
  canal?: ORIGEM_ATENDIMENTO;

  @ApiPropertyOptional({
    enum: MODO_ATENDIMENTO,
    description: 'Filtra por modo de atendimento',
  })
  @IsOptional()
  @IsEnum(MODO_ATENDIMENTO)
  modoAtendimento?: MODO_ATENDIMENTO;
}

export class RelatorioVendedorDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nome: string;

  @ApiPropertyOptional()
  avatar?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  dataInicio: Date;

  @ApiProperty()
  totalLeads: number;

  @ApiProperty()
  emAtendimento: number;

  @ApiProperty()
  emResgate: number;

  @ApiProperty()
  convertidos: number;

  @ApiProperty({ description: 'Taxa de conversão em %' })
  taxaConversao: number;

  @ApiProperty({
    type: 'object',
    description: 'Segmentação de leads por temperatura',
  })
  segmentacaoTemperatura: {
    frio: number;
    morno: number;
    quente: number;
    total: number;
  };

  @ApiProperty({
    type: 'object',
    description: 'Segmentação de temperatura inicial/final para qualificação',
  })
  segmentacaoTemperaturaQualificacao: {
    frio: { inicial: number; final: number; porcentagemInicial: number; porcentagemFinal: number };
    morno: { inicial: number; final: number; porcentagemInicial: number; porcentagemFinal: number };
    quente: { inicial: number; final: number; porcentagemInicial: number; porcentagemFinal: number };
    total: number;
  };

  @ApiProperty()
  atendimentosBemSucedidos: number;

  @ApiProperty({ description: 'Taxa de sucesso em %' })
  taxaSucesso: number;

  @ApiProperty()
  atendimentosNaoConcluidos: number;

  @ApiProperty({ description: 'Taxa de insucesso em %' })
  taxaInsucesso: number;

  @ApiProperty({ description: 'Média de leads qualificados em %' })
  mediaQualificacao: number;

  @ApiProperty({ description: 'Média de conversão em %' })
  mediaConversao: number;

  @ApiProperty({
    type: [Object],
    description: 'Série histórica por mês',
  })
  serieHistorica: {
    mes: string;
    leads: number;
    conversoes: number;
  }[];

  @ApiProperty()
  insucessos: number;

  @ApiProperty({ description: 'Tempo médio de resposta, exemplo: "3h 20min"' })
  tempoMedioResposta: string;

  @ApiProperty({ description: 'Tempo médio de finalização, exemplo: "2h 15min"' })
  tempoMedioFinalizacao: string;

  @ApiProperty({
    type: Object,
    description: 'Conversão por temperatura'
  })
  conversaoPorTemperatura: {
    frio: { total: number; conversoes: number; taxa: number };
    morno: { total: number; conversoes: number; taxa: number };
    quente: { total: number; conversoes: number; taxa: number };
  };

  @ApiProperty({
    type: Object,
    description: 'Tempo médio por etapa do atendimento'
  })
  tempoMedioPorEtapa: {
    'Pré-atendimento': string;
    'Atendimento Inicial': string;
    'Visita': string;
    'Em Negociação': string;
    'Resgate': string;
  };

  @ApiProperty({
    type: Object,
    description: 'Motivos de perdas e negociais com valores e porcentagens'
  })
  motivosPerdasNegociais: {
    precoAlto: { valor: number; porcentagem: number };
    concorrencia: { valor: number; porcentagem: number };
    naoQualificado: { valor: number; porcentagem: number };
    timing: { valor: number; porcentagem: number };
    outros: { valor: number; porcentagem: number };
    totalPerdas: number;
    principalMotivo: string;
    taxaPerda: number;
    submotivosPorMotivo: Record<string, Array<{ submotivo: string; quantidade: number; porcentagem: number }>>;
    submotivosDetalhados: Array<{ motivoPrincipal: string; submotivo: string; quantidade: number; porcentagem: number }>;
  };

  @ApiProperty({ description: 'Percentual de conversão em %' })
  percentualConversao: number;

  @ApiProperty()
  taxaConversaoShowroom: number;

  @ApiProperty()
  numeroConversaoOnline: number;

  @ApiProperty()
  numeroConversaoShowroom: number;

  @ApiProperty({
    type: [Object],
    description: 'Leads vs conversões em vendas de todos os vendedores da loja no período selecionado'
  })
  leadsVsConversoesVendedor: {
    id: string;
    nome: string;
    avatar?: string;
    leads: number;
    conversoes: number;
  }[];
}

export class RankingVendedorDto {
  @ApiProperty({
    type: [Object],
    description: 'Top vendedores por taxa de conversão',
  })
  topConversao: {
    id: string;
    nome: string;
    taxaConversao: number;
  }[];

  @ApiProperty({
    type: [Object],
    description: 'Top vendedores por média de qualificação',
  })
  topQualificacao: {
    id: string;
    nome: string;
    mediaQualificacao: number;
  }[];
}

export class RelatorioCanalDto {
  @ApiProperty()
  canal: string;

  @ApiProperty()
  nomeExibicao: string;

  @ApiPropertyOptional()
  iconeUrl?: string;

  @ApiPropertyOptional()
  url?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  dataCadastro?: Date;

  @ApiProperty()
  leadsTotal: number;

  @ApiProperty()
  conversoes: number;

  @ApiProperty({ description: 'Taxa de conversão em %' })
  taxaConversao: number;

  @ApiProperty({
    type: [Object],
    description: 'Resumo diário dos leads e conversões',
  })
  resumoDia: {
    data: string;
    leads: number;
    conversoes: number;
  }[];

  @ApiProperty({
    type: [Object],
    description: 'Série histórica mensal',
  })
  serieHistorica: {
    mes: string;
    leads: number;
    qualificacoes: number;
    conversoes: number;
  }[];
}

export class RelatorioCanaisDto extends Array<{
  modo: string;
  canais: RelatorioCanalDto[];
  totalLeads: number;
  totalConversoes: number;
  mediaConversaoGeral: number;
  destaques: {
    porLeads: {
      canal: string;
      nomeExibicao: string;
      valor: number;
      crescimento: number;
    }[];
    porConversas: {
      canal: string;
      nomeExibicao: string;
      valor: number;
      crescimento: number;
    }[];
  };
  ranking: {
    porLeads: {
      canal: string;
      nomeExibicao: string;
      valor: number;
      posicao: number;
    }[];
    porConversoes: {
      canal: string;
      nomeExibicao: string;
      valor: number;
      posicao: number;
    }[];
  };
}> {}

export class RelatorioDetalhadoVendedorDto {
  @ApiProperty({ type: Object })
  vendedor: {
    id: string;
    nome: string;
    avatar?: string;
  };

  @ApiPropertyOptional({
    type: [Object],
    description: 'Lista de vendedores que contribuíram para as métricas (apenas no relatório consolidado)',
  })
  vendedoresContribuintes?: {
    id: string;
    nome: string;
    avatar?: string;
  }[];

  @ApiProperty({ type: Object })
  periodo: {
    inicio: Date;
    fim: Date;
  };

  @ApiProperty()
  totalLeads: number;

  @ApiProperty({ description: 'Percentual de conversão em %' })
  percentualConversao: number;

  @ApiProperty()
  atendimentosBemSucedidos: number;

  @ApiProperty()
  totalVendasGeradas: number;

  @ApiProperty({
    type: [Object],
    description: 'Gráfico de leads do vendedor por canal',
  })
  graficoLeadsPorCanal: {
    canal: string;
    leads: number;
    qualificados: number;
  }[];

  @ApiProperty()
  mediaQualificacao: number;

  @ApiProperty()
  mediaConversao: number;

  @ApiProperty({ type: Object })
  segmentacaoStatus: {
    inicial: number;
    emVisita: number;
    resgate: number;
    negociacao: number;
    total: number;
  };

  @ApiProperty({ type: Object })
  segmentacaoTemperatura: {
    frio: number;
    morno: number;
    quente: number;
  };

  @ApiProperty({
    type: 'object',
    description: 'Segmentação de temperatura inicial/final para qualificação',
  })
  segmentacaoTemperaturaQualificacao: {
    frio: { inicial: number; final: number; porcentagemInicial: number; porcentagemFinal: number };
    morno: { inicial: number; final: number; porcentagemInicial: number; porcentagemFinal: number };
    quente: { inicial: number; final: number; porcentagemInicial: number; porcentagemFinal: number };
    total: number;
  };

  @ApiProperty()
  taxaConversaoShowroom: number;

  @ApiProperty({ description: 'Tempo médio de resposta, exemplo: "3h 20min"' })
  tempoMedioResposta: string;

  @ApiProperty()
  insucessos: number;

  @ApiProperty({ description: 'Taxa de insucesso em %' })
  taxaInsucesso: number;

  @ApiProperty({ description: 'Taxa de sucesso em %' })
  taxaSucesso: number;

  @ApiProperty({ description: 'Tempo médio até o fechamento, exemplo: "2h 15min"' })
  tempoMedioFechamento: string;

  @ApiProperty()
  numeroConversaoOnline: number;

  @ApiProperty()
  numeroConversaoShowroom: number;

  @ApiProperty({
    type: Object,
    description: 'Tempo médio por etapa de negociação'
  })
  tempoMedioPorEtapaNegociacao: {
    'Pré-atendimento': string;
    'Atendimento Inicial': string;
    'Visita': string;
    'Em Negociação': string;
    'Resgate': string;
    etapaMaisRapida: string;
    etapaMaisLenta: string;
  };

  @ApiProperty({
    type: Object,
    description: 'Motivos de perdas e negociais com valores e porcentagens'
  })
  motivosPerdasNegociais: {
    precoAlto: { valor: number; porcentagem: number };
    concorrencia: { valor: number; porcentagem: number };
    naoQualificado: { valor: number; porcentagem: number };
    timing: { valor: number; porcentagem: number };
    outros: { valor: number; porcentagem: number };
    totalPerdas: number;
    principalMotivo: string;
    taxaPerda: number;
    submotivosPorMotivo: Record<string, Array<{ submotivo: string; quantidade: number; porcentagem: number }>>;
    submotivosDetalhados: Array<{ motivoPrincipal: string; submotivo: string; quantidade: number; porcentagem: number }>;
  };

  @ApiProperty({
    type: [Object],
    description: 'Leads vs conversões em vendas de todos os vendedores da loja no período selecionado'
  })
  leadsVsConversoesVendedor: {
    id: string;
    nome: string;
    avatar?: string;
    leads: number;
    conversoes: number;
  }[];

  @ApiProperty({
    type: [Object],
    description: 'Ranking do vendedor a cada mês',
  })
  rankingMensal: {
    mes: string;
    conversoes: number;
    posicao: number;
  }[];

  @ApiProperty({
    type: [Object],
    description: 'Vendas diárias por vendedor do ranking (top 3 + usuário logado)',
  })
  vendasDiariasPorVendedor: {
    id: string;
    nome: string;
    avatar?: string;
    serieVendas: {
      data: string;
      vendas: number;
    }[];
  }[];
}

export class RelatorioGeralDto {
  @ApiProperty({ type: Object })
  periodo: {
    inicio: Date;
    fim: Date;
  };

  @ApiProperty({
    type: [Object],
    description: 'Ranking de canais por índice de qualificação',
  })
  rankingCanais: {
    canal: string;
    indiceQualificacao: number;
  }[];

  @ApiProperty({
    type: [Object],
    description: 'Visão dos indicadores da pré-venda',
  })
  visaoPreVenda: {
    id: string;
    vendedor: string;
    avatar?: string;
    tempoNaPlataforma: string;
    leadsRecebidos: number;
    emAtendimento: number;
    qualificados: number;
    taxaQualificacao: number;
    leadsResgatados: number;
    leadsConvertidos: number;
    mediaConversao: number;
  }[];

  @ApiProperty({
    type: RankingVendedorDto,
    description: 'Ranking de vendedores por conversão e qualificação'
  })
  rankingVendedores: RankingVendedorDto;

  @ApiProperty({ description: 'Tempo médio de resposta geral, exemplo: "3h 20min"' })
  tempoMedioRespostaGeral: string;

  @ApiProperty({ description: 'Tempo médio de finalização geral, exemplo: "2h 15min"' })
  tempoMedioFinalizacaoGeral: string;

  @ApiProperty({
    type: Object,
    description: 'Conversão por temperatura geral'
  })
  conversaoPorTemperaturaGeral: {
    frio: { total: number; conversoes: number; taxa: number };
    morno: { total: number; conversoes: number; taxa: number };
    quente: { total: number; conversoes: number; taxa: number };
  };

  @ApiProperty({
    type: [Object],
    description: 'Métricas de visitas por pré-vendedores'
  })
  metricasVisitasPreVendedores: {
    vendedor: string;
    visitasAgendadas: number;
    visitasRealizadas: number;
    visitasConvertidas: number;
    taxaConversaoVisitas: number;
  }[];

  @ApiProperty({
    type: Object,
    description: 'Métricas gerais de visitas agregadas'
  })
  metricasVisitasGeral: {
    totalVisitasAgendadas: number;
    visitasBemSucedidas: number;
    taxaSucessoVisitas: number;
  };

  @ApiProperty({
    type: Object,
    description: 'Tempo médio por etapa de negociação geral'
  })
  tempoMedioPorEtapaNegociacaoGeral: {
    'Pré-atendimento': string;
    'Atendimento Inicial': string;
    'Visita': string;
    'Em Negociação': string;
    'Resgate': string;
    etapaMaisRapida: string;
    etapaMaisLenta: string;
  };

  @ApiProperty({
    type: [Object],
    description: 'Relatório detalhado por modo de atendimento, incluindo totalizador geral'
  })
  relatorioPorModo: {
    modo: string;
    totalAtendimentos: number;
    atendimentosBemSucedidos: number;
    insucessos: number;
    taxaSucesso: number;
    taxaInsucesso: number;
    mediaConversao: number;
    mediaQualificacao: number;
    quantidadeSucesso: number;
    taxaResgate: number;
    quantidadeConversao: number;
    quantidadeQualificacao: number;
    taxaConversaoLeads: number;
    quantidadeConversaoLeads: number;
    quantidadeShowroom: number;
    quantidadeShowroomSucesso: number;
    taxaShowroom: number;
    tempoMedioRespostaPreVendedor: {
      mes: string;
      tempoMedio: string;
    }[];
    tempoMedioRespostaVendedor: {
      mes: string;
      tempoMedio: string;
    }[];
    agendamentosVisitas: number;
    taxaComparecimentoVisitas: number;
    visitasCompareceram: number;
    motivosPerda: {
      motivo: string;
      porcentagem: number;
      total: number;
      submotivos?: Array<{ submotivo: string; quantidade: number; porcentagem: number }>;
    }[];
    motivosPerdasPreAtendimento: {
      motivo: string;
      porcentagem: number;
      total: number;
      submotivos?: Array<{ submotivo: string; quantidade: number; porcentagem: number }>;
    }[];
    segmentacaoStatus: {
      inicial: number;
      emVisita: number;
      resgate: number;
      negociacao: number;
      total: number;
    };
    segmentacaoTemperatura: {
      frio: { valor: number; porcentagem: number };
      morno: { valor: number; porcentagem: number };
      quente: { valor: number; porcentagem: number };
    };
    tempoMedioResposta?: string;
    tempoMedioFinalizacao?: string;
    conversaoPorTemperatura?: {
      frio: { total: number; conversoes: number; taxa: number };
      morno: { total: number; conversoes: number; taxa: number };
      quente: { total: number; conversoes: number; taxa: number };
    };
    atendimentosPreAtendimentoSemFollowUp?: {
      id: string;
      nomeAtendimento: string;
      periodo: string;
      status: string;
      colaborador?: string;
      diasSemFollowUp: number;
    }[];
    atendimentosVendasSemFollowUp?: {
      id: string;
      nomeAtendimento: string;
      periodo: string;
      status: string;
      colaborador?: string;
      diasSemFollowUp: number;
    }[];
  }[];

  @ApiProperty({
    type: [Object],
    description: 'Lista dos 8 atendimentos em PRE_ATENDIMENTO há mais tempo sem follow-up'
  })
  atendimentosPreAtendimento: {
    id: string;
    nomeAtendimento: string;
    periodo: string;
    status: string;
    colaborador?: string;
    diasSemFollowUp: number;
  }[];

  @ApiProperty({
    type: [Object],
    description: 'Lista dos 8 atendimentos em vendas (ATENDIMENTO_INICIAL, VISITA, EM_NEGOCIACAO) há mais tempo sem follow-up'
  })
  atendimentosVendas: {
    id: string;
    nomeAtendimento: string;
    periodo: string;
    status: string;
    colaborador?: string;
    diasSemFollowUp: number;
  }[];

  @ApiProperty({
    type: [Object],
    description: 'Principais motivos de perda de atendimentos que passaram apenas por PRE_ATENDIMENTO e foram direto para PERDIDO'
  })
  motivosPerdasPreAtendimento: {
    motivo: string;
    porcentagem: number;
    total: number;
    submotivos?: Array<{ submotivo: string; quantidade: number; porcentagem: number }>;
  }[];
}

export class FiltroTop3VendedoresDto {
  @ApiProperty({
    type: Number,
    description: 'Mês (1-12)',
    minimum: 1,
    maximum: 12,
  })
  mes: number;

  @ApiProperty({
    type: Number,
    description: 'Ano (ex: 2024)',
  })
  ano: number;

  @ApiProperty({
    type: String,
    description: 'ID do usuário logado para incluir nos dados',
  })
  idUsuarioLogado: string;
}

export class VendedorVendasDiariasDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nome: string;

  @ApiPropertyOptional()
  avatar?: string;

  @ApiProperty()
  totalVendas: number;

  @ApiProperty()
  posicaoRanking: number;

  @ApiProperty({
    type: [Object],
    description: 'Série de vendas diárias do mês',
  })
  serieVendas: {
    data: string;
    vendas: number;
  }[];
}

export class UsuarioLogadoVendasDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nome: string;

  @ApiPropertyOptional()
  avatar?: string;

  @ApiProperty({
    type: Object,
    description: 'Dados do mês atual',
  })
  mesAtual: {
    totalVendas: number;
    posicaoRanking: number;
    serieVendas: {
      data: string;
      vendas: number;
    }[];
  };

  @ApiProperty({
    type: Object,
    description: 'Dados do mês anterior',
  })
  mesAnterior: {
    totalVendas: number;
    posicaoRanking: number;
    serieVendas: {
      data: string;
      vendas: number;
    }[];
  };
}

export class Top3VendedoresDto {
  @ApiProperty({
    type: Object,
    description: 'Período analisado',
  })
  periodo: {
    mes: number;
    ano: number;
  };

  @ApiProperty({
    type: [VendedorVendasDiariasDto],
    description: 'Top 3 vendedores do mês',
  })
  top3Vendedores: VendedorVendasDiariasDto[];

  @ApiProperty({
    type: UsuarioLogadoVendasDto,
    description: 'Dados do usuário logado (mês atual e anterior)',
  })
  usuarioLogado: UsuarioLogadoVendasDto;
}

export class RelatorioVendedoresPorModoDto {
  @ApiProperty()
  modo: string;

  @ApiProperty({
    type: [RelatorioVendedorDto],
    description: 'Lista de vendedores para o modo',
  })
  vendedores: RelatorioVendedorDto[];

  @ApiProperty()
  totalLeads: number;

  @ApiProperty()
  totalConversoes: number;

  @ApiProperty({ description: 'Média de conversão geral em %' })
  mediaConversaoGeral: number;

  @ApiProperty({ description: 'Percentual de conversão em %' })
  percentualConversao: number;

  @ApiProperty()
  numeroConversaoOnline: number;

  @ApiProperty()
  numeroConversaoShowroom: number;

  @ApiProperty()
  taxaConversaoShowroom: number;

  @ApiProperty()
  totalShowroom: number;

  @ApiProperty()
  totalOnline: number;

  @ApiProperty({ description: 'Taxa de conversão online em %' })
  taxaConversaoOnline: number;
}
