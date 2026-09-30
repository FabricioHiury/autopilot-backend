import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ConfigurarDistribuicaoDto {
  @ApiProperty({
    description: 'Habilitar distribuição automática de atendimentos',
    example: true,
  })
  @IsBoolean()
  distribuicaoAutomatica: boolean;
}