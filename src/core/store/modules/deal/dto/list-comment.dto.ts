import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumberString } from 'class-validator';

export class ListCommentsDto {
  @ApiProperty({ example: '1', required: false })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiProperty({ example: '10', required: false })
  @IsOptional()
  @IsNumberString()
  itemsPage?: string;
}
