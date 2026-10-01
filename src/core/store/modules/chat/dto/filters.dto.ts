import { ApiProperty } from '@nestjs/swagger';
import {
  IsBooleanString,
  IsOptional,
  IsDateString,
  IsIn,
} from 'class-validator';

export class FiltersRoutesListing {
  @ApiProperty({ example: 'search' })
  @IsOptional()
  search: string;

  @ApiProperty({ example: 1 })
  @IsOptional()
  page: number;

  @ApiProperty({ example: 10 })
  @IsOptional()
  limit: number;

  @ApiProperty({
    example: 'true',
    description:
      'Define if must be displayed only the chats where o user is assignee by the deal',
  })
  @IsBooleanString()
  @IsOptional()
  own?: string;

  @ApiProperty({
    example: 'whatsapp',
    description:
      'Filter by channel of origin (whatsapp, instagram, facebook, etc.)',
  })
  @IsOptional()
  channel?: string;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Data of start of period for filter chats',
  })
  @IsDateString()
  @IsOptional()
  dataStart?: string;

  @ApiProperty({
    example: '2024-12-31T23:59:59.999Z',
    description: 'Data of end of period for filter chats',
  })
  @IsDateString()
  @IsOptional()
  dataEnd?: string;

  @ApiProperty({
    example: 'recent',
    description:
      "Sorting: 'recent' (more recent first), 'previous' (more previous first)",
  })
  @IsOptional()
  @IsIn(['recent', 'previous'])
  sorting?: string;

  @ApiProperty({
    example: 'awaiting_reply',
    description:
      "Filter by status of chat: 'awaiting_reply', 'at_open', 'finalized', 'archived'",
  })
  @IsOptional()
  @IsIn(['awaiting_reply', 'at_open', 'finalized', 'archived'])
  statusChat?: string;

  @ApiProperty({
    example: 'uuid-of-user',
    description: 'ID of user assignee by the deal for filter chats specific',
  })
  @IsOptional()
  idUserAssignee?: string;
}
