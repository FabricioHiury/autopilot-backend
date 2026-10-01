import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateTicketDto {
  @ApiProperty({ example: 'Overcharge' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Complaint' })
  @IsString()
  category: string;

  @ApiProperty({ example: 'Description quick of message' })
  @IsString()
  subject: string;

  @ApiProperty({ example: 'Content of complaint' })
  @IsString()
  message: string;
}
