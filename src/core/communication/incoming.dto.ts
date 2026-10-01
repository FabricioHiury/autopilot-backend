import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
export class IncomingEventDto {
  @IsUUID() storeId: string;
  @IsString() @IsNotEmpty() @MaxLength(200) eventId: string;
  @IsString() @IsNotEmpty() @MaxLength(200) externalMessageId: string;
  @IsString() @IsNotEmpty() @MaxLength(200) externalContactId: string;
  @IsIn(['whatsapp', 'instagram', 'facebook', 'olx']) channel: string;
  @IsOptional() @IsString() @MaxLength(20000) text?: string;
  @IsOptional() @IsString() @MaxLength(2000) attachmentUrl?: string;
  @IsOptional() @IsString() attachmentType?: string;
  @IsOptional() @IsString() quotedMessageId?: string;
  @IsOptional() @IsString() @MaxLength(200) name?: string;
  @IsOptional() @IsString() externalAdId?: string;
  @IsOptional() @IsBoolean() sentByStore?: boolean;
  @IsDateString() timestamp: string;
}
export class MessageAckDto {
  @IsUUID() storeId: string;
  @IsUUID() messageId: string;
  @IsOptional() @IsString() externalMessageId?: string;
  @IsIn(['SENT', 'DELIVERED', 'READ', 'FAILED']) status: string;
}
