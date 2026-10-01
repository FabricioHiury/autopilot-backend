import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { FaqCategory, FaqStatus } from 'src/utils/enum/faq.enum';

export class CreateFaqDto {
  @ApiProperty({ example: 'As resolver problem?' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: FaqCategory.ACCOUNT, enum: FaqCategory })
  @IsNotEmpty()
  @IsString()
  @IsEnum(FaqCategory)
  category: FaqCategory;

  @ApiProperty({ example: FaqStatus.PUBLISHED, enum: FaqStatus })
  @IsNotEmpty()
  @IsString()
  @IsEnum(FaqStatus)
  status: FaqStatus;

  @ApiProperty({ example: ['deal', 'new'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiProperty({ example: 'Lorem ispum dolor asasds' })
  @IsNotEmpty()
  @IsString()
  content: string;
}
