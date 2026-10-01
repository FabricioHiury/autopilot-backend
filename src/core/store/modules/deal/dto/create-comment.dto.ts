import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'Comment of test', required: true })
  @IsString()
  @IsNotEmpty()
  comment: string;
}
