import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { FaqCategoria, FaqStatus } from 'src/utils/enum/faq.enum';

export class ListarFaqDto {
  @IsOptional()
  @IsEnum(FaqCategoria)
  categoria: FaqCategoria;

  @IsOptional()
  @IsEnum(FaqStatus)
  status: FaqStatus;

  @IsOptional()
  @IsString()
  pesquisa: string;

  @IsOptional()
  @Matches(/^([a-zA-Z0-9-_]+,)*[a-zA-Z0-9-_]+$/, {
    message:
      'O campo deve ser uma lista de tags separados por vírgula, ou uma única tag.',
  })
  tags: string;

  @ApiProperty({ example: '10', default: '1', required: false })
  @IsOptional()
  @IsNumberString()
  pagina: string;

  @ApiProperty({ example: '8', default: '10', required: false })
  @IsOptional()
  @IsNumberString()
  quantidade: string;
}
