import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class EditMessageTemplateDto {
  @ApiProperty({
    description: 'Title of message template',
    example: 'Greeting initial updated',
    maxLength: 100,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'The title must ter in maximum 100 characters' })
  title?: string;

  @ApiProperty({
    description: 'Content of message template',
    example: 'Hello! Welcome to our store. How can I help you today?',
    maxLength: 1000,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000, { message: 'O content must ter in maximum 1000 characters' })
  content?: string;
}
