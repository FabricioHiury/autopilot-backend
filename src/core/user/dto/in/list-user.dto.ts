import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumberString, IsOptional, IsString } from 'class-validator';

export class ListUsersDto {
  @ApiProperty({ example: '10', default: '1', required: false })
  @IsOptional()
  @IsNumberString()
  page: string;

  @ApiProperty({ example: '8', default: '10', required: false })
  @IsOptional()
  @IsNumberString()
  limit: string;

  @ApiProperty({ example: 'João', required: false })
  @IsOptional()
  @IsString()
  search: string;

  @ApiProperty({ example: 'all', default: 'all', required: false })
  @IsOptional()
  @IsString()
  @IsEnum(['all', 'active', 'inactive'])
  status: string;
}
