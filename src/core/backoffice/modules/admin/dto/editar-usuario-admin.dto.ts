import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';

export class EditarUsuarioAdminDto {
  @ApiProperty({ example: 'João da Silva', required: false })
  @IsString()
  @IsOptional()
  nome?: string;

  @ApiProperty({ example: 'joao@email.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'ativo', required: false })
  @IsIn(['ativo', 'inativo'])
  @IsString()
  @IsOptional()
  status?: string;
}
