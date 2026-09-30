import { ApiProperty } from '@nestjs/swagger';

export class ResponseAcessoBackofficeDto {
  @ApiProperty({ description: 'ID do usuário' })
  id: string;

  @ApiProperty({ description: 'Nome do usuário' })
  nome: string;

  @ApiProperty({ description: 'Email do usuário' })
  email: string;

  @ApiProperty({ description: 'Perfil do usuário' })
  perfil: string;

  @ApiProperty({ description: 'Cargo do usuário', type: [String] })
  cargo: string[];

  @ApiProperty({ description: 'Lista de permissões do usuário', type: [String] })
  permissao: string[];

  @ApiProperty({ description: 'Status do usuário' })
  status: string;

  @ApiProperty({ description: 'Data da consulta' })
  consultaEm: Date;
}
