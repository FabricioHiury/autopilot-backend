import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CriarComentarioDto {
  @ApiProperty({ example: 'Comentário de teste', required: true })
  @IsString()
  @IsNotEmpty()
  comentario: string;
}
