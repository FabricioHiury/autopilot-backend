import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTagDto {
  @ApiProperty({
    description: 'Tag name',
    example: 'Urgent',
    maxLength: 50,
  })
  @IsNotEmpty({ message: 'Tag name is required' })
  @IsString({ message: 'Name must be a string' })
  @MaxLength(50, { message: 'Name must have at most 50 characters' })
  name: string;

  @ApiProperty({
    description: 'Tag color in hexadecimal',
    example: '#FF5733',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Color must be a string' })
  color?: string;

  @ApiProperty({
    description: 'Tag description',
    example: 'Tag for urgent tickets',
    required: false,
    maxLength: 200,
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(200, { message: 'Description must have at most 200 characters' })
  description?: string;
}
