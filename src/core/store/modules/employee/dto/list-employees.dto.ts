import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumberString } from 'class-validator';

export class ListEmployeesDto {
  @ApiProperty({
    example: 'Employee of silva',
    default: '',
    required: false,
  })
  @IsOptional()
  search: string;

  @ApiProperty({
    example: 'Manager',
    required: false,
  })
  @IsOptional()
  role: string;

  @ApiProperty({ example: '10', default: '1', required: false })
  @IsOptional()
  @IsNumberString()
  page: string;

  @ApiProperty({ example: '8', default: '10', required: false })
  @IsOptional()
  @IsNumberString()
  limit: string;
}
