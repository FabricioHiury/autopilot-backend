import { ApiProperty } from '@nestjs/swagger';

export class ConfigurarIntegracaoWppSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ type: String })
  data: 'WhatsApp configurado com sucesso. A loja está liberada para obter o QR code de autenticação.';
}
