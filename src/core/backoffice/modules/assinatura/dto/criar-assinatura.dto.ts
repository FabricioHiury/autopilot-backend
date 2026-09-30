import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CriarAssinaturaDto {
  @ApiProperty({
    description: 'ID do plano que está sendo assinado',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  idPlano: string;

  @ApiProperty({
    description: 'ID da loja que está realizando a assinatura',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  idLoja: string;

  @ApiProperty({
    description: 'ID do Método de Pagamento',
    example: 'pm_1P4g5cEaZ3lqY9bZ5j6k7l8m',
  })
  @IsString()
  @IsNotEmpty()
  idMetodoPagamentoStripe: string;
}