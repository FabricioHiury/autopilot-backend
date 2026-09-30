import { Controller, Get, Put, Body, UseGuards, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DistribuicaoAutomaticaService } from './distribuicao-automatica.service';
import { LojaId } from 'src/auth/auth/decorators/loja-id-decorator';
import { ConfigurarDistribuicaoDto } from './dto/configurar-distribuicao.dto';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';

@ApiTags('Loja - Distribuição Automática')
@Controller('loja/distribuicao-automatica')
@UseGuards(JwtAuthGuard)
export class DistribuicaoAutomaticaController {
  constructor(
    private readonly distribuicaoAutomaticaService: DistribuicaoAutomaticaService,
  ) {}

  @Get('configuracao')
  @ApiOperation({ summary: 'Obter configuração de distribuição automática' })
  async obterConfiguracao(@LojaId() idLoja: string) {
    return await this.distribuicaoAutomaticaService.obterConfiguracaoDistribuicao(idLoja);
  }

  @Put('configuracao')
  @ApiOperation({ summary: 'Configurar distribuição automática' })
  async configurar(
    @LojaId() idLoja: string,
    @Body() dados: ConfigurarDistribuicaoDto,
  ) {
    return await this.distribuicaoAutomaticaService.configurarDistribuicaoAutomatica(
      idLoja,
      dados.distribuicaoAutomatica,
    );
  }

  @Post('monitorar-suspensos')
  async monitorarSuspensos() {
    return await this.distribuicaoAutomaticaService.monitorarERedistribuirSuspensos();
  }
}