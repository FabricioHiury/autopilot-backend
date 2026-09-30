import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsNumberString } from 'class-validator';

export class HistoricoClienteDto {
  @ApiProperty({
    description: 'ID do cliente (obrigatório se não informar idClienteTemporario)',
    example: 'uuid-do-cliente',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID do cliente deve ser um UUID válido' })
  idCliente?: string;

  @ApiProperty({
    description: 'ID do cliente temporário (obrigatório se não informar idCliente)',
    example: 'uuid-do-cliente-temporario',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID do cliente temporário deve ser um UUID válido' })
  idClienteTemporario?: string;

  @ApiProperty({
    description: 'Número da página',
    example: '1',
    default: '1',
    required: false,
  })
  @IsOptional()
  @IsNumberString({}, { message: 'Página deve ser um número' })
  pagina?: string = '1';

  @ApiProperty({
    description: 'Quantidade de itens por página',
    example: '10',
    default: '10',
    required: false,
  })
  @IsOptional()
  @IsNumberString({}, { message: 'Itens por página deve ser um número' })
  itensPagina?: string = '10';

  @ApiProperty({
    description: 'Termo de pesquisa para filtrar por título ou descrição',
    example: 'problema produto',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Pesquisa deve ser uma string' })
  pesquisa?: string;
}