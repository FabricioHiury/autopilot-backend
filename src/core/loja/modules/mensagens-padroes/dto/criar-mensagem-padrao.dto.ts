import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CriarMensagemPadraoDto {
  @ApiProperty({
    description: 'Título da mensagem padrão',
    example: 'Saudação inicial',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'O título é obrigatório' })
  @MaxLength(100, { message: 'O título deve ter no máximo 100 caracteres' })
  titulo: string;

  @ApiProperty({
    description: 'Conteúdo da mensagem padrão',
    example: 'Olá! Bem-vindo à nossa loja. Como posso ajudá-lo hoje?',
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty({ message: 'O conteúdo é obrigatório' })
  @MaxLength(1000, { message: 'O conteúdo deve ter no máximo 1000 caracteres' })
  conteudo: string;
}
