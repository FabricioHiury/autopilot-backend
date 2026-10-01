import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { IntegrationsEnum } from '../enum/channel.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SendMessageDto {
  @ApiProperty({
    example: 'recipient',
    description: 'Recipient of message, of accordance with o channel',
  })
  @IsString()
  @IsNotEmpty()
  recipient: string;

  @ApiProperty({ example: 'message' })
  @IsString()
  @IsOptional()
  text?: string;

  @ApiProperty({
    example: 'attachmentUrl',
    description: 'URL of attachment of message, if present',
  })
  @IsString()
  @IsOptional()
  attachmentUrl?: string;

  @IsString()
  @IsOptional()
  attachmentType?: string;

  @ApiProperty({
    example: 'quotedMessageId',
    description: 'Message of reference, at case of reply',
  })
  @IsString()
  @IsOptional()
  quotedMessageId?: string;

  @ApiProperty({ example: 'whatsapp', enum: IntegrationsEnum })
  @IsEnum(IntegrationsEnum)
  @IsNotEmpty()
  channel: IntegrationsEnum;

  @ApiProperty({ example: -23.5505, description: 'Latitude of location' })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiProperty({ example: -46.6333, description: 'Longitude of location' })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiProperty({
    example: 'Shopping Center',
    description: 'Name of location',
  })
  @IsString()
  @IsOptional()
  locationName?: string;

  @ApiProperty({
    example: 'Street of Flores, 123',
    description: 'Address of location',
  })
  @IsString()
  @IsOptional()
  locationAddress?: string;

  @ApiProperty({
    example: 'https://maps.google.com/...',
    description: 'URL of location',
  })
  @IsString()
  @IsOptional()
  locationUrl?: string;

  @ApiProperty({
    example: 'text',
    description: 'Type of message: text, image, audio, video, reaction',
  })
  @IsString()
  @IsOptional()
  type?: string;
}

class MetadataMessageDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  mobile?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsString()
  @IsOptional()
  externalAdId?: string;
}

export class ContactDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;
}

export class LocationDto {
  @IsNumber()
  @IsNotEmpty()
  lat: number;

  @IsNumber()
  @IsNotEmpty()
  lng: number;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  address?: string;
}

export class CallDto {
  @IsString()
  @IsNotEmpty()
  callId: string;

  @IsNumber()
  @IsNotEmpty()
  duration: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsDateString()
  @IsNotEmpty()
  timestamp: Date;
}

export class IncomingMessageDto {
  @IsString()
  @IsNotEmpty()
  storeId: string;

  @IsString()
  @IsOptional()
  message?: string;

  @IsString()
  @IsOptional()
  attachmentUrl?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  messageId?: string;

  @IsString()
  @IsOptional()
  quotedMessageId?: string;

  @IsEnum(IntegrationsEnum)
  @IsNotEmpty()
  channel: IntegrationsEnum;

  @IsString()
  @IsNotEmpty()
  externalRecipientId: string;

  @IsOptional()
  @IsBoolean()
  sentByStore?: boolean;

  @IsDateString()
  @IsNotEmpty()
  timestamp: Date;

  @IsOptional()
  @Type(() => MetadataMessageDto)
  metadata?: MetadataMessageDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactDto)
  @IsOptional()
  contacts?: ContactDto[];

  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  location?: LocationDto;

  @ValidateNested()
  @Type(() => CallDto)
  @IsOptional()
  call?: CallDto;

  @IsString()
  @IsOptional()
  originInstagram?: string;
}
