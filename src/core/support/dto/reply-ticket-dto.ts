import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ReplyTicketDto {
  @ApiProperty({ example: 'Request resolved' })
  @IsString()
  reply: string;
}
