import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { FaqCategoria, FaqStatus } from 'src/utils/enum/faq.enum';

export class CriarFaqDto {
  @ApiProperty({ example: 'Como resolver problema?' })
  @IsNotEmpty()
  @IsString()
  titulo: string;

  @ApiProperty({ example: FaqCategoria.ASSINATURA, enum: FaqCategoria })
  @IsNotEmpty()
  @IsString()
  @IsEnum(FaqCategoria)
  categoria: FaqCategoria;

  @ApiProperty({ example: FaqStatus.PUBLICADO, enum: FaqStatus })
  @IsNotEmpty()
  @IsString()
  @IsEnum(FaqStatus)
  status: FaqStatus;

  @ApiProperty({ example: ['atendimento', 'novo'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiProperty({ example: 'Lorem ispum dolor asasds' })
  @IsNotEmpty()
  @IsString()
  conteudo: string;
}
