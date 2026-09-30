import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, IsEnum, IsBoolean, IsArray } from 'class-validator';

export class EditarPlanoDto {
  @ApiProperty({ example: 'Premium Plus', description: 'Nome do plano', required: false })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiProperty({ example: 129.90, description: 'Valor do plano em reais', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  valor?: number;

  @ApiProperty({ 
    example: 'Plano premium com funcionalidades avançadas', 
    description: 'Descrição do plano',
    required: false 
  })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({ 
    example: 'ativo', 
    description: 'Status do plano',
    enum: ['ativo', 'inativo'],
    required: false 
  })
  @IsOptional()
  @IsEnum(['ativo', 'inativo'])
  status?: string;

  @ApiProperty({ example: 'price_1234567890', description: 'ID do preço no Stripe', required: false })
  @IsOptional()
  @IsString()
  idPrecoStripe?: string;

  @ApiProperty({ example: 129.90, description: 'Preço do plano em reais', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  preco?: number;

  @ApiProperty({ 
    example: 'mensal', 
    description: 'Período de cobrança do plano',
    enum: ['mensal', 'anual', 'trimestral'],
    required: false 
  })
  @IsOptional()
  @IsEnum(['mensal', 'anual', 'trimestral'])
  periodo?: string;

  @ApiProperty({ example: true, description: 'Se o plano está ativo', required: false })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @ApiProperty({ 
    example: ['recurso1', 'recurso2'], 
    description: 'Lista de recursos do plano',
    type: [String],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recursos?: string[];
}