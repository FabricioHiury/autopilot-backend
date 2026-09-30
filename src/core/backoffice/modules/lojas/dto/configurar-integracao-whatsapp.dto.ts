import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class ConfigurarIntegracaoWppDto {
  @ApiProperty({
    description: 'ID da loja',
    example: '8681cf27-db80-4fdb-8446-82844110a627',
  })
  @IsNotEmpty()
  @IsUUID()
  idLoja: string;

  @ApiProperty()
  @IsOptional()
  integracoesLiberadas?: boolean;
}
