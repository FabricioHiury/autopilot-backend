import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateMessageTemplateDto {
  @ApiProperty({
    description: 'Title of message template',
    example: 'Greeting initial',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'The title is required' })
  @MaxLength(100, { message: 'The title must ter in maximum 100 characters' })
  title: string;

  @ApiProperty({
    description: 'Content of message template',
    example: 'Hello! Welcome to our store. How can I help you today?',
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty({ message: 'O content is required' })
  @MaxLength(1000, { message: 'O content must ter in maximum 1000 characters' })
  content: string;
}
