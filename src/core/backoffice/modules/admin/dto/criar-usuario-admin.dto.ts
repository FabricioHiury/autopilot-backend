import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  Validate,
} from 'class-validator';
import { PERMISSOES_AUTOPILOT } from 'src/core/usuario/enum/permissoes_funcionalidades.enum';
import { IsInEnum } from '../utils/admin.utils';

export class CriarUsuarioAdminDto {
  @ApiProperty({ example: 'João da Silva' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ example: 'joao@email.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Senha@123' })
  @IsStrongPassword()
  @IsNotEmpty()
  senha: string;

  @ApiProperty({
    example:
      'Instruções adicionais para serem enviadas no email ao usuário que será cadastrado.',
  })
  @IsString()
  @IsOptional()
  observacoes: string;

  @ApiProperty({
    example: ['autopilotVerAssinantes', 'autopilotVerDashboard'],
    isArray: true,
    type: String,
    enum: PERMISSOES_AUTOPILOT,
  })
  @IsArray()
  @IsNotEmpty({ each: true })
  @IsString({ each: true })
  @Validate(IsInEnum, { each: true })
  permissoes: string[];
}
