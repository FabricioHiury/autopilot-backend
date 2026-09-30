import { Controller, Post, Body, UseGuards, Delete, Get } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { AssinaturaService } from 'src/core/backoffice/modules/assinatura/assinatura.service';
import { CriarAssinaturaDto } from 'src/core/backoffice/modules/assinatura/dto/criar-assinatura.dto';
import { LojaId } from 'src/auth/auth/decorators/loja-id-decorator';

@Controller('loja/assinatura')
@UseGuards(JwtAuthGuard)
export class AssinaturaController {
  constructor(private readonly assinaturaService: AssinaturaService) {}

  @Post('/')
  async criarAssinatura(@Body() body: CriarAssinaturaDto, @LojaId() idLoja: string) {
    const criarAssinaturaDto: CriarAssinaturaDto = {
      idLoja,
      idPlano: body.idPlano,
      idMetodoPagamentoStripe: body.idMetodoPagamentoStripe,
    };
    return await this.assinaturaService.criarAssinatura(criarAssinaturaDto);
  }

  @Delete('/cancelar')
  async cancelarAssinatura(@LojaId() idLoja: string) {
    return await this.assinaturaService.cancelarAssinaturaPorLoja(idLoja);
  }

  @Get('/status')
  async verificarStatusAssinatura(@LojaId() idLoja: string) {
    return await this.assinaturaService.verificarAssinaturaAtiva(idLoja);
  }
}
