import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class LinkTagsDto {
  @ApiProperty({
    description: 'Array of tag IDs to be linked to the ticket',
    example: ['uuid-tag-1', 'uuid-tag-2'],
    type: [String],
  })
  @IsNotEmpty({ message: 'Tags array is required' })
  @IsArray({ message: 'Tags must be an array' })
  @IsString({ each: true, message: 'Each tag must be a string' })
  tags: string[];
}