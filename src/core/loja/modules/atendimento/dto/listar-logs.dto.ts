import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsPositive, Max, Min } from 'class-validator';

export class ListarLogsDto {
  @ApiProperty({
    description: 'Número da página',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Min(1)
  pagina?: number = 1;

  @ApiProperty({
    description: 'Quantidade de logs por página',
    example: 20,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Min(1)
  @Max(100)
  quantidade?: number = 20;
}