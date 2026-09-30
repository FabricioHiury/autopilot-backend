import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsStrongPassword,
  IsNotEmpty,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { USUARIO_PERFIL } from '../../enum/perfil.enum';

export class CriarUsuarioDto {
  @ApiProperty({ example: 'mail@mail.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsStrongPassword()
  @IsNotEmpty()
  senha: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  nome: string;

  @ApiProperty({ enum: USUARIO_PERFIL })
  @IsString()
  @IsEnum(USUARIO_PERFIL)
  perfil: string;
}
