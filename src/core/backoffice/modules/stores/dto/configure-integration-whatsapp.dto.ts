import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class ConfigureIntegrationWppDto {
  @ApiProperty({
    description: 'ID of store',
    example: '8681cf27-db80-4fdb-8446-82844110a627',
  })
  @IsNotEmpty()
  @IsUUID()
  storeId: string;

  @ApiProperty()
  @IsOptional()
  integrationsEnabled?: boolean;
}
