import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsStrongPassword,
} from 'class-validator';

export class EditarAdminLogadoDto {
  @ApiProperty({ example: 'João da Silva', required: false })
  @IsString()
  @IsOptional()
  nome?: string;

  @ApiProperty({ example: 'joao@email.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'Senha@123', required: false })
  @IsStrongPassword()
  @IsOptional()
  senha?: string;
}
