import {
  Body,
  Controller,
  Delete,
  Get,
  Put,
  UseGuards,
  Post,
  Param,
  Query,
} from '@nestjs/common';
import { ChatService } from '../store/modules/chat/chat.service';
import { IsNotEmpty, IsString } from 'class-validator';
import { IntegrationService } from './integration.service';
import {
  IntegrationFacebook,
  IntegrationInstagram,
  IntegrationOlx,
  IntegrationWpp,
} from './dto/integration.dto';
import {
  ConfigureWhatsAppOfficialDto,
  SetWhatsAppApiTypeDto,
} from './dto/whatsapp-official.dto';
import { ApiTags } from '@nestjs/swagger';
import {
  IntegrateFacebookDoc,
  IntegrateInstagramDoc,
  IntegrateOlxDoc,
  IntegrateWhatsAppDoc,
  ListIntegrationsDoc,
  OlxLinkRedirectDoc,
  RemoveOlxDoc,
  StatusIntegrationsDoc,
} from './docs/integration.swagger';
import { StoreId } from 'src/auth/auth/decorators/store-id-decorator';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';

class VerifyNumberDto {
  @IsString() @IsNotEmpty() number: string;
}

@ApiTags('Integration')
@Controller('integrations')
export class IntegrationController {
  constructor(
    private readonly integrationService: IntegrationService,
    private readonly chatService: ChatService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('whatsapp/verify-number')
  verifyNumber(@StoreId() storeId: string, @Body() input: VerifyNumberDto) {
    return this.chatService.whatsappAvailable(storeId, input.number);
  }

  @ListIntegrationsDoc()
  @UseGuards(JwtAuthGuard)
  @Get('list-integrations')
  async listIntegrations() {
    return await this.integrationService.listIntegrations();
  }

  @StatusIntegrationsDoc()
  @Get('status')
  @UseGuards(JwtAuthGuard)
  async listStoreIntegrationStatus(@StoreId() storeId: string) {
    return await this.integrationService.listStoreIntegrationStatus(storeId);
  }

  @IntegrateWhatsAppDoc()
  @UseGuards(JwtAuthGuard)
  @Post('whatsapp/connect')
  async integrateWhatsapp(@StoreId() storeId: string) {
    return await this.integrationService.integrateWpp({ storeId });
  }

  @IntegrateOlxDoc()
  @UseGuards(JwtAuthGuard)
  @Put('olx')
  async integrateOlx(
    @StoreId() storeId: string,
    @Body() integrationOlx: IntegrationOlx,
  ) {
    return await this.integrationService.integrateOlx({
      ...integrationOlx,
      storeId,
    });
  }

  @RemoveOlxDoc()
  @UseGuards(JwtAuthGuard)
  @Delete('olx/remove')
  async removeOlx(@StoreId() storeId: string) {
    return await this.integrationService.removeOlx(storeId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('whatsapp')
  async removeWhatsApp(@StoreId() storeId: string) {
    return await this.integrationService.removeWhatsAppIntegration(storeId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('whatsapp/official')
  async configureWhatsAppOfficial(
    @StoreId() storeId: string,
    @Body() dto: ConfigureWhatsAppOfficialDto,
  ) {
    return await this.integrationService.configureWhatsAppOfficial({
      ...dto,
      storeId,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('whatsapp/api-status')
  async getWhatsAppApiStatus(@StoreId() storeId: string) {
    return await this.integrationService.getWhatsAppApiStatus(storeId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('whatsapp/official/phone-numbers')
  async getWhatsAppOfficialPhoneNumbers(
    @Query('wabaId') wabaId: string,
    @Query('accessToken') accessToken: string,
  ) {
    return await this.integrationService.getWhatsAppOfficialPhoneNumbers(
      wabaId,
      accessToken,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Put('whatsapp/api-type')
  async setWhatsAppApiType(
    @StoreId() storeId: string,
    @Body() dto: SetWhatsAppApiTypeDto,
  ) {
    return await this.integrationService.setWhatsAppApiType(storeId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('whatsapp/official')
  async removeWhatsAppOfficial(@StoreId() storeId: string) {
    return await this.integrationService.removeWhatsAppIntegration(storeId);
  }

  @OlxLinkRedirectDoc()
  @Get('olx-link-redirect')
  async webhookAuthentication() {
    return await this.integrationService.integrateOlxWebhookAuthentication();
  }

  @IntegrateInstagramDoc()
  @UseGuards(JwtAuthGuard)
  @Put('instagram')
  async integrateInstagram(
    @StoreId() storeId: string,
    @Body() integrationInstagram: IntegrationInstagram,
  ) {
    return await this.integrationService.integrateInstagram({
      ...integrationInstagram,
      storeId,
    });
  }

  @IntegrateFacebookDoc()
  @UseGuards(JwtAuthGuard)
  @Put('facebook')
  async integrateFacebook(
    @StoreId() storeId: string,
    @Body() integrationFacebook: IntegrationFacebook,
  ) {
    return await this.integrationService.integrateFacebook({
      ...integrationFacebook,
      storeId,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('clear-cache/:channel')
  async clearIntegrationCache(
    @Param('channel')
    channel: 'whatsapp' | 'instagram' | 'facebook' | 'olx' | 'other',
    @StoreId() storeId: string,
  ) {
    await this.integrationService.clearIntegrationCache(storeId, channel);
    return {
      success: true,
      message: `Cache of ${channel} cleared with success`,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('clear-all-cache')
  async clearAllIntegrationCache(@StoreId() storeId: string) {
    await this.integrationService.clearAllStoreIntegrationCache(storeId);
    return { success: true, message: 'Cache of all the integrations cleared' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('health/:channel')
  async checkIntegrationHealth(
    @Param('channel')
    channel: 'whatsapp' | 'instagram' | 'facebook' | 'olx' | 'other',
    @StoreId() storeId: string,
  ) {
    const result = await this.integrationService.checkIntegrationHealth(
      storeId,
      channel,
    );
    return { success: true, data: result };
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh/:channel')
  async forceRefreshIntegration(
    @Param('channel')
    channel: 'whatsapp' | 'instagram' | 'facebook' | 'olx' | 'other',
    @StoreId() storeId: string,
  ) {
    const result = await this.integrationService.forceRefreshIntegration(
      storeId,
      channel,
    );
    return { success: true, data: result };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':channel/remove-with-cache')
  async removeIntegrationWithCache(
    @Param('channel')
    channel: 'whatsapp' | 'instagram' | 'facebook' | 'olx' | 'other',
    @StoreId() storeId: string,
  ) {
    await this.integrationService.removeIntegrationWithCache(storeId, channel);
    return { success: true, message: `${channel} removed with success` };
  }

  @UseGuards(JwtAuthGuard)
  @Get('cache-stats')
  async getCacheStats() {
    const stats = await this.integrationService.getCacheStats();
    return { success: true, data: stats };
  }
}
