import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  MODE_DEAL,
  ORIGIN_DEAL,
  STATUS_DEAL,
  TEMPERATURE_DEAL,
} from 'src/utils/enum/deal.enum';

export class CreateDealDto {
  @ApiProperty({ example: 'Deal of test' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'Description...', required: false })
  @IsOptional()
  @IsString()
  descriptionDeal?: string;

  @ApiProperty({ example: 'Deal of test', required: false })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({
    example: ORIGIN_DEAL.INSTAGRAM,
    enum: ORIGIN_DEAL,
  })
  @IsNotEmpty()
  @IsEnum(ORIGIN_DEAL)
  dealOrigin: ORIGIN_DEAL;

  @ApiProperty({
    example: TEMPERATURE_DEAL.COLD,
    enum: TEMPERATURE_DEAL,
  })
  @IsNotEmpty()
  @IsEnum(TEMPERATURE_DEAL)
  temperature: TEMPERATURE_DEAL;

  @ApiProperty({ example: MODE_DEAL.BUY, enum: MODE_DEAL })
  @IsNotEmpty()
  @IsEnum(MODE_DEAL)
  dealMode: MODE_DEAL;

  @ApiProperty({
    example: [
      '8681cf27-db80-4fdb-8446-82844110a627',
      '8681cf27-db80-4fdb-8446-82844110a627',
    ],
    description: 'Array of inteiros',
  })
  @IsArray()
  @IsOptional()
  @IsUUID(4, { each: true })
  idAssignees?: string[];

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiProperty({ example: 'José of Silva', required: false })
  @IsOptional()
  @IsString()
  nameComplete?: string;

  @ApiProperty({ example: 'jose@email.com', required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ example: '11999999999', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: '10', required: false })
  @IsOptional()
  @IsString()
  chatId?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  distributionAutomatic?: boolean;

  @ApiProperty({
    example: STATUS_DEAL.PRE_DEAL,
    enum: STATUS_DEAL,
    required: false,
  })
  @IsOptional()
  @IsEnum(STATUS_DEAL)
  status?: STATUS_DEAL;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  dealManual?: boolean;

  @ApiProperty({
    example: [
      '8681cf27-db80-4fdb-8446-82844110a627',
      '8681cf27-db80-4fdb-8446-82844110a628',
    ],
    description: 'Array of IDs of tags a be vinculadas to deal',
    required: false,
  })
  @IsArray()
  @IsOptional()
  @IsUUID(4, { each: true })
  idTags?: string[];
}
