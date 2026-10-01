import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumberString } from 'class-validator';

export class GetAttachmentsDealDto {
  @ApiProperty({ example: '1', default: '1', required: false })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiProperty({ example: '10', default: '4', required: false })
  @IsOptional()
  @IsNumberString()
  itemsByPage?: string;
}
