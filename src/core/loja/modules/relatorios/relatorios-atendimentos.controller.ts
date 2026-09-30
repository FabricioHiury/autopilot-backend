import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { RelatoriosAtendimentosService } from './relatorios-atendimentos.service';
import {
  FiltroRelatorioDto,
  RelatorioVendedorDto,
  RelatorioCanaisDto,
  RelatorioDetalhadoVendedorDto,
  RelatorioGeralDto,
  RankingVendedorDto,
  Top3VendedoresDto,
  FiltroTop3VendedoresDto,
} from './dto/relatorio-atendimentos.dto';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { UsuarioId } from 'src/auth/auth/decorators/usuario-id-decorator';

@ApiTags('Relatórios - Atendimentos')
@Controller('loja/:idLoja/relatorios/atendimentos')
@UseGuards(JwtAuthGuard)
export class RelatoriosAtendimentosController {
  constructor(
    private readonly relatoriosService: RelatoriosAtendimentosService,
  ) {}

  @ApiOperation({ summary: 'Relatório por vendedor' })
  @ApiResponse({ status: 200, description: 'Relatório gerado com sucesso', type: [RelatorioVendedorDto] })
  @ApiParam({ name: 'idLoja', description: 'ID da loja' })
  @Get('vendedor')
  async relatorioPorVendedor(
    @Param('idLoja') idLoja: string,
    @Query() filtro: FiltroRelatorioDto,
  ): Promise<RelatorioVendedorDto[]> {
    return this.relatoriosService.gerarRelatorioPorVendedor(idLoja, filtro);
  }

  @ApiOperation({ summary: 'Ranking de vendedores' })
  @ApiResponse({ status: 200, description: 'Ranking gerado com sucesso', type: RankingVendedorDto })
  @ApiParam({ name: 'idLoja', description: 'ID da loja' })
  @Get('vendedor/ranking')
  async rankingVendedores(
    @Param('idLoja') idLoja: string,
    @Query() filtro: FiltroRelatorioDto,
  ): Promise<RankingVendedorDto> {
    return this.relatoriosService.gerarRankingVendedores(idLoja, filtro);
  }

  @ApiOperation({ summary: 'Relatório por canal' })
  @ApiResponse({ status: 200, description: 'Relatório gerado com sucesso', type: RelatorioCanaisDto })
  @ApiParam({ name: 'idLoja', description: 'ID da loja' })
  @Get('canal')
  async relatorioPorCanal(
    @Param('idLoja') idLoja: string,
    @Query() filtro: FiltroRelatorioDto,
  ): Promise<RelatorioCanaisDto> {
    return this.relatoriosService.gerarRelatorioPorCanal(idLoja, filtro);
  }

  @ApiOperation({ summary: 'Relatório detalhado por vendedor' })
  @ApiResponse({ status: 200, description: 'Relatório gerado com sucesso', type: RelatorioDetalhadoVendedorDto })
  @ApiParam({ name: 'idLoja', description: 'ID da loja' })
  @Get('vendedor/detalhado')
  async relatorioDetalhadoVendedorConsolidado(
    @Param('idLoja') idLoja: string,
    @Query() filtro: FiltroRelatorioDto,
    @UsuarioId() idUsuarioLogado: string,
  ): Promise<RelatorioDetalhadoVendedorDto[]> {
    return this.relatoriosService.gerarRelatorioDetalhadoVendedor(
      idLoja,
      filtro,
      idUsuarioLogado,
    ) as Promise<RelatorioDetalhadoVendedorDto[]>;
  }

  @ApiOperation({ summary: 'Relatório geral' })
  @ApiResponse({ status: 200, description: 'Relatório gerado com sucesso', type: RelatorioGeralDto })
  @ApiParam({ name: 'idLoja', description: 'ID da loja' })
  @Get('geral')
  async relatorioGeral(
    @Param('idLoja') idLoja: string,
    @Query() filtro: FiltroRelatorioDto,
  ): Promise<RelatorioGeralDto> {
    return this.relatoriosService.gerarRelatorioGeral(idLoja, filtro);
  }

  @ApiOperation({ summary: 'Top 3 vendedores com dados do usuário logado' })
  @ApiResponse({ status: 200, description: 'Relatório gerado com sucesso', type: Top3VendedoresDto })
  @ApiParam({ name: 'idLoja', description: 'ID da loja' })
  @Get('top3-vendedores')
  async obterTop3VendedoresComUsuarioLogado(
    @Param('idLoja') idLoja: string,
    @Query() filtro: FiltroTop3VendedoresDto,
    @UsuarioId() idUsuarioLogado: string,
  ): Promise<Top3VendedoresDto> {
    const filtroComUsuario = { ...filtro, idUsuarioLogado };
    return this.relatoriosService.obterTop3VendedoresComUsuarioLogado(
      idLoja,
      filtroComUsuario,
    );
  }
}