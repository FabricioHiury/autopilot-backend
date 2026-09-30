import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class RemoverResponsaveisDto {
  @ApiProperty({
    example: ['550e8400-e29b-41d4-a716-446655440000', '6ba7b810-9dad-11d1-80b4-00c04fd430c8'],
    required: true,
    description: 'Array de UUIDs dos responsáveis',
  })
  @IsArray()
  @IsUUID(4, { each: true })
  idResponsaveis: string[];
}
