import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, IsBoolean, IsEnum, IsArray } from 'class-validator';

export class CriarPlanoDto {
  @ApiProperty({ example: 'Plano teste', description: 'Nome do plano' })
  @IsString()
  nome: string;

  @ApiProperty({ 
    example: 'Plano premium com todas as funcionalidades', 
    description: 'Descrição do plano',
    required: false 
  })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({ example: 100.9, description: 'Preço do plano em reais' })
  @IsNumber()
  @Min(0)
  preco: number;

  @ApiProperty({ 
    example: 'mensal', 
    description: 'Período de cobrança do plano',
    enum: ['mensal', 'anual', 'trimestral']
  })
  @IsEnum(['mensal', 'anual', 'trimestral'])
  periodo: string;

  @ApiProperty({ example: true, description: 'Se o plano está ativo' })
  @IsBoolean()
  ativo: boolean;

  @ApiProperty({ 
    example: ['oi', 'mais'], 
    description: 'Lista de recursos do plano',
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  recursos: string[];

  @ApiProperty({ example: 'price_1234567890', description: 'ID do preço no Stripe', required: false })
  @IsOptional()
  @IsString()
  idPrecoStripe?: string;
}