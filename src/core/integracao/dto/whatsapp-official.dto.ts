import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export class ConfigureWhatsAppOfficialDto {
  @ApiProperty({
    description: 'Store ID',
    example: '8681cf27-db80-4fdb-8446-82844110a627',
  })
  @IsNotEmpty()
  @IsString()
  storeId: string;

  @ApiProperty({
    description: 'WhatsApp Business Account ID',
    example: '1234567890123456',
  })
  @IsNotEmpty()
  @IsString()
  wabaId: string;

  @ApiProperty({
    description: 'Phone Number ID',
    example: '9876543210987654',
  })
  @IsNotEmpty()
  @IsString()
  phoneNumberId: string;

  @ApiProperty({
    description: 'Access Token',
    example: 'EAAxxxxxx...',
  })
  @IsNotEmpty()
  @IsString()
  accessToken: string;

  @ApiProperty({
    description: 'Webhook Verify Token',
    example: 'my_verify_token_123',
  })
  @IsNotEmpty()
  @IsString()
  verifyToken: string;

  @ApiProperty({
    description: 'Business Phone Number',
    example: '5511999999999',
  })
  @IsNotEmpty()
  @IsString()
  businessPhone: string;
}

export class SetWhatsAppApiTypeDto {
  @ApiProperty({
    description: 'API Type',
    enum: ['official', 'unofficial'],
    example: 'official',
  })
  @IsNotEmpty()
  @IsEnum(['official', 'unofficial'])
  apiType: 'official' | 'unofficial';
}

export class WhatsAppApiStatusDto {
  @ApiProperty({
    description: 'Current API Type',
    enum: ['official', 'unofficial'],
  })
  apiType: 'official' | 'unofficial';

  @ApiProperty({
    description: 'Is Official API configured',
  })
  officialConfigured: boolean;

  @ApiProperty({
    description: 'Is Unofficial API configured',
  })
  unofficialConfigured: boolean;

  @ApiProperty({
    description: 'Message window status (for official API)',
    required: false,
  })
  messageWindow?: {
    isActive: boolean;
    hoursRemaining?: number;
    lastCustomerMessageAt?: string;
  };
}
