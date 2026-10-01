import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Matches,
  IsEnum,
  IsDateString,
  IsNumberString,
} from 'class-validator';
import { ToISO8601 } from 'src/utils/transformers/toISO8601.transformer';
import { PriorityTicketEnum } from '../enum/priority-ticket-enum';
import { StatusTicketEnum } from '../enum/status-ticket-enum';
import { CategoryTicketEnum } from '../enum/category-ticket-enum';

export class ListTicketDto {
  @ApiProperty({
    example: 'Name of customer',
    required: false,
    description: 'Search by title or name of customer',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    example: PriorityTicketEnum.URGENT,
    enum: PriorityTicketEnum,
    required: false,
  })
  @IsOptional()
  @IsEnum(PriorityTicketEnum)
  priority?: PriorityTicketEnum;

  @ApiProperty({
    example: StatusTicketEnum.RESOLUTION,
    enum: StatusTicketEnum,
    required: false,
  })
  @IsOptional()
  @IsEnum(StatusTicketEnum)
  status?: StatusTicketEnum;

  @ApiProperty({
    example: CategoryTicketEnum.ACCOUNT,
    enum: CategoryTicketEnum,
    required: false,
  })
  @IsOptional()
  @IsEnum(CategoryTicketEnum)
  category?: CategoryTicketEnum;

  @ApiProperty({
    example: '2024-06-17',
    required: false,
  })
  @IsString()
  @IsDateString()
  @IsOptional()
  @ToISO8601()
  dataInitial: Date;

  @ApiProperty({
    example: '2024-06-17',
    required: false,
  })
  @IsString()
  @IsDateString()
  @IsOptional()
  @ToISO8601()
  dataFinal: Date;

  @ApiProperty({ example: '1', required: false })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiProperty({ example: '10', required: false })
  @IsOptional()
  @IsNumberString()
  itemsPage?: string;
}
