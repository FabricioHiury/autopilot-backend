import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { FaqCategory, FaqStatus } from 'src/utils/enum/faq.enum';

export class ListFaqDto {
  @IsOptional()
  @IsEnum(FaqCategory)
  category: FaqCategory;

  @IsOptional()
  @IsEnum(FaqStatus)
  status: FaqStatus;

  @IsOptional()
  @IsString()
  search: string;

  @IsOptional()
  @Matches(/^([a-zA-Z0-9-_]+,)*[a-zA-Z0-9-_]+$/, {
    message:
      'The field must be a list of tags separated by comma, or a single tag.',
  })
  tags: string;

  @ApiProperty({ example: '10', default: '1', required: false })
  @IsOptional()
  @IsNumberString()
  page: string;

  @ApiProperty({ example: '8', default: '10', required: false })
  @IsOptional()
  @IsNumberString()
  limit: string;
}
