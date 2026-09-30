import { Body, Controller, Delete, Get, Put, UseGuards, Post, Param, Query } from '@nestjs/common';
import { IntegracaoService } from './integracao.service';
import {
  IntegrationFacebook,
  IntegrationInstagram,
  IntegrationOlx,
  IntegrationWpp,
} from './dto/integracao.dto';
import {
  ConfigureWhatsAppOfficialDto,
  SetWhatsAppApiTypeDto,
} from './dto/whatsapp-official.dto';
import { ApiTags } from '@nestjs/swagger';
import {
  IntegrarFacebookDoc,
  IntegrarInstagramDoc,
  IntegrarOlxDoc,
  IntegrarWhatsAppDoc,
  ListarIntegracoesDoc,
  OlxLinkRedirectDoc,
  RemoverOlxDoc,
  StatusIntegracoesDoc,
} from './docs/integracao.swagger';
import { LojaId } from 'src/auth/auth/decorators/loja-id-decorator';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { AssinaturaGuard } from '../backoffice/modules/assinatura/guards/assinatura.guard';

@ApiTags('Integracao')
@Controller('integracao')
export class IntegracaoController {
  constructor(private readonly integracaoService: IntegracaoService) { }

  @ListarIntegracoesDoc()
  @UseGuards(JwtAuthGuard)
  @Get('listar-integracoes')
  async listIntegrations() {
    return await this.integracaoService.listIntegrations();
  }

  @StatusIntegracoesDoc()
  @Get('status-integracoes')
  @UseGuards(JwtAuthGuard)
  async listStoreIntegrationStatus(@LojaId() storeId: string) {
    return await this.integracaoService.listStoreIntegrationStatus(storeId);
  }

  @IntegrarWhatsAppDoc()
  @UseGuards(JwtAuthGuard, AssinaturaGuard)
  @Put('whatsapp')
  async integrateWhatsapp(@Body() integrationWpp: IntegrationWpp) {
    return await this.integracaoService.integrateWpp(integrationWpp);
  }

  @IntegrarOlxDoc()
  @UseGuards(JwtAuthGuard, AssinaturaGuard)
  @Put('olx')
  async integrateOlx(@Body() integrationOlx: IntegrationOlx) {
    return await this.integracaoService.integrateOlx(integrationOlx);
  }

  @RemoverOlxDoc()
  @UseGuards(JwtAuthGuard)
  @Delete('olx/remover')
  async removeOlx(@LojaId() storeId: string) {
    return await this.integracaoService.removeOlx(storeId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('whatsapp/remover')
  async removeWhatsApp(@LojaId() storeId: string) {
    return await this.integracaoService.removeWhatsAppIntegration(storeId);
  }

  @UseGuards(JwtAuthGuard, AssinaturaGuard)
  @Put('whatsapp/official')
  async configureWhatsAppOfficial(@Body() dto: ConfigureWhatsAppOfficialDto) {
    return await this.integracaoService.configureWhatsAppOfficial(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('whatsapp/api-status')
  async getWhatsAppApiStatus(@LojaId() storeId: string) {
    return await this.integracaoService.getWhatsAppApiStatus(storeId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('whatsapp/official/phone-numbers')
  async getWhatsAppOfficialPhoneNumbers(
    @Query('wabaId') wabaId: string,
    @Query('accessToken') accessToken: string,
  ) {
    return await this.integracaoService.getWhatsAppOfficialPhoneNumbers(wabaId, accessToken);
  }

  @UseGuards(JwtAuthGuard)
  @Put('whatsapp/api-type')
  async setWhatsAppApiType(
    @LojaId() storeId: string,
    @Body() dto: SetWhatsAppApiTypeDto
  ) {
    return await this.integracaoService.setWhatsAppApiType(storeId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('whatsapp/official')
  async removeWhatsAppOfficial(@LojaId() storeId: string) {
    return await this.integracaoService.removeWhatsAppIntegration(storeId);
  }

  @OlxLinkRedirectDoc()
  @Get('olx-link-redirect')
  async webhookAuthentication() {
    return await this.integracaoService.integrateOlxWebhookAuthentication();
  }

  @IntegrarInstagramDoc()
  @UseGuards(JwtAuthGuard, AssinaturaGuard)
  @Put('instagram')
  async integrateInstagram(@Body() integrationInstagram: IntegrationInstagram) {
    return await this.integracaoService.integrateInstagram(integrationInstagram);
  }

  @IntegrarFacebookDoc()
  @UseGuards(JwtAuthGuard, AssinaturaGuard)
  @Put('facebook')
  async integrateFacebook(@Body() integrationFacebook: IntegrationFacebook) {
    return await this.integracaoService.integrateFacebook(integrationFacebook);
  }

  @UseGuards(JwtAuthGuard)
  @Post('clear-cache/:channel')
  async clearIntegrationCache(
    @Param('channel') channel: 'whatsapp' | 'instagram' | 'facebook' | 'olx' | 'outros',
    @LojaId() storeId: string
  ) {
    await this.integracaoService.clearIntegrationCache(storeId, channel);
    return { success: true, message: `Cache de ${channel} limpo com sucesso` };
  }

  @UseGuards(JwtAuthGuard)
  @Post('clear-all-cache')
  async clearAllIntegrationCache(@LojaId() storeId: string) {
    await this.integracaoService.clearAllStoreIntegrationCache(storeId);
    return { success: true, message: 'Cache de todas as integrações limpo' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('health/:channel')
  async checkIntegrationHealth(
    @Param('channel') channel: 'whatsapp' | 'instagram' | 'facebook' | 'olx' | 'outros',
    @LojaId() storeId: string
  ) {
    const result = await this.integracaoService.checkIntegrationHealth(storeId, channel);
    return { success: true, data: result };
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh/:channel')
  async forceRefreshIntegration(
    @Param('channel') channel: 'whatsapp' | 'instagram' | 'facebook' | 'olx' | 'outros',
    @LojaId() storeId: string
  ) {
    const result = await this.integracaoService.forceRefreshIntegration(storeId, channel);
    return { success: true, data: result };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':channel/remove-with-cache')
  async removeIntegrationWithCache(
    @Param('channel') channel: 'whatsapp' | 'instagram' | 'facebook' | 'olx' | 'outros',
    @LojaId() storeId: string
  ) {
    await this.integracaoService.removeIntegrationWithCache(storeId, channel);
    return { success: true, message: `${channel} removido com sucesso` };
  }

  @UseGuards(JwtAuthGuard)
  @Get('cache-stats')
  async getCacheStats() {
    const stats = await this.integracaoService.getCacheStats();
    return { success: true, data: stats };
  }
}
