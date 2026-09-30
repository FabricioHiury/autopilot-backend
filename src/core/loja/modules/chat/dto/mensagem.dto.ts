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
import { IntegracoesEnum } from '../enum/canal.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class EnviarMensagemDto {
  @ApiProperty({
    example: 'destinatario',
    description: 'Destinatário da mensagem, de acordo com o canal',
  })
  @IsString()
  @IsNotEmpty()
  destinatario: string;

  @ApiProperty({ example: 'mensagem' })
  @IsString()
  @IsOptional()
  mensagem?: string;

  @ApiProperty({
    example: 'anexoMensagem',
    description: 'URL do anexo da mensagem, se houver',
  })
  @IsString()
  @IsOptional()
  anexoMensagem?: string;

  @IsString()
  @IsOptional()
  tipoAnexo?: string;

  @ApiProperty({
    example: 'mensagemReferencia',
    description: 'Mensagem de referência, em caso de resposta',
  })
  @IsString()
  @IsOptional()
  mensagemReferencia?: string;

  @ApiProperty({ example: 'whatsapp', enum: IntegracoesEnum })
  @IsEnum(IntegracoesEnum)
  @IsNotEmpty()
  canal: IntegracoesEnum;

  @ApiProperty({ example: -23.5505, description: 'Latitude da localização' })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiProperty({ example: -46.6333, description: 'Longitude da localização' })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiProperty({
    example: 'Shopping Center',
    description: 'Nome da localização',
  })
  @IsString()
  @IsOptional()
  locationName?: string;

  @ApiProperty({
    example: 'Rua das Flores, 123',
    description: 'Endereço da localização',
  })
  @IsString()
  @IsOptional()
  locationAddress?: string;

  @ApiProperty({
    example: 'https://maps.google.com/...',
    description: 'URL da localização',
  })
  @IsString()
  @IsOptional()
  locationUrl?: string;

  @ApiProperty({
    example: 'text',
    description: 'Tipo da mensagem: text, image, audio, video, reaction',
  })
  @IsString()
  @IsOptional()
  tipo?: string;
}

class MetadadosMensagemDto {
  @IsString()
  @IsOptional()
  nome?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  celular?: string;

  @IsString()
  @IsOptional()
  urlAvatar?: string;

  @IsString()
  @IsOptional()
  idAnuncioExterno?: string;
}

export class ContatoDto {
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

export class ChatMensagemEntradaDto {
  @IsString()
  @IsNotEmpty()
  storeId: string;

  @IsString()
  @IsOptional()
  mensagem?: string;

  @IsString()
  @IsOptional()
  anexoMensagem?: string;

  @IsString()
  @IsOptional()
  tipo?: string;

  @IsString()
  @IsOptional()
  idMensagem?: string;

  @IsString()
  @IsOptional()
  mensagemReferencia?: string;

  @IsEnum(IntegracoesEnum)
  @IsNotEmpty()
  canal: IntegracoesEnum;

  @IsString()
  @IsNotEmpty()
  idDestinatarioApiExterna: string;

  @IsOptional()
  @IsBoolean()
  enviadaLoja?: boolean;

  @IsDateString()
  @IsNotEmpty()
  timestamp: Date;

  @IsOptional()
  @Type(() => MetadadosMensagemDto)
  metadados?: MetadadosMensagemDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContatoDto)
  @IsOptional()
  contatos?: ContatoDto[];

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
  origemInstagram?: string; 
}
