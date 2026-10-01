import { ApiProperty } from '@nestjs/swagger';

export class ConfigureIntegrationWppSuccess {
  @ApiProperty({ example: 'Operation completed with success' })
  message: string;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ type: String })
  data: 'WhatsApp configured with success. A store is enabled for get o QR code of authentication.';
}
