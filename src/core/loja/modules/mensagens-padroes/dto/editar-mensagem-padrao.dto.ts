import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class EditarMensagemPadraoDto {
  @ApiProperty({
    description: 'Título da mensagem padrão',
    example: 'Saudação inicial atualizada',
    maxLength: 100,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'O título deve ter no máximo 100 caracteres' })
  titulo?: string;

  @ApiProperty({
    description: 'Conteúdo da mensagem padrão',
    example: 'Olá! Bem-vindo à nossa loja. Como posso ajudá-lo hoje?',
    maxLength: 1000,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000, { message: 'O conteúdo deve ter no máximo 1000 caracteres' })
  conteudo?: string;
}
