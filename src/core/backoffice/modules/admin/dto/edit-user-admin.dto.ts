import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';

export class EditUserAdminDto {
  @ApiProperty({ example: 'João of Silva', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'joao@email.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'active', required: false })
  @IsIn(['active', 'inactive'])
  @IsString()
  @IsOptional()
  status?: string;
}
