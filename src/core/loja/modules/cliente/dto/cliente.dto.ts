import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';
import { TIPO_PESSOA } from '../enum/cliente.enum';
import { ToLowerCase } from 'src/utils/transformers/toLowerCase.transformer';
import { ToISO8601 } from 'src/utils/transformers/toISO8601.transformer';
import { ToNumberString } from 'src/utils/transformers/toNumberString.transformer';
import { IsUnique } from 'src/utils/validator/isUnique';

export class ClienteDTO {
  id: string;
  idLoja: string;
  idFoto?: string;
  nome: string;
  tipoPessoa: TIPO_PESSOA;
  documentoFiscal: string;
  rg?: string;
  estrangeiro: boolean;
  genero: string;
  dataNascimento: Date;
  observacoes?: string;
  telefone: string;
  whatsapp: string;
  email?: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

export class ClienteEnderecoDto {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 1 })
  idCliente: string;

  @ApiProperty({ example: '55555555' })
  cep: string;

  @ApiProperty({ example: 'sp' })
  uf: string;

  @ApiProperty({ example: 'Sao Paulo' })
  municipio: string;

  @ApiProperty({ example: 'Sao Paulo' })
  endereco: string;

  @ApiProperty({ example: 'bairro' })
  bairro: string;

  @ApiProperty({ example: 1 })
  numero: string;

  @ApiProperty({ example: 'Complemento' })
  complemento: string;

  @ApiProperty({ example: '2024-08-26T21:24:04.855Z' })
  criadoEm: Date;

  @ApiProperty({ example: '2024-08-26T21:24:04.855Z' })
  atualizadoEm: Date;
}

export class CriarClienteDto {
  @ApiProperty({ example: 'Jose da Silva' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ example: 'fisica', enum: TIPO_PESSOA })
  @IsEnum(TIPO_PESSOA)
  @IsNotEmpty()
  tipoPessoa: TIPO_PESSOA;

  @ApiProperty({ example: '12345678910' })
  @IsString()
  @IsNotEmpty()
  // @IsUnique({ field: 'documentoFiscal', table: 'cliente' })
  @ToNumberString()
  documentoFiscal: string;

  @ApiProperty({ example: '123456789', required: false })
  @IsString()
  @IsOptional()
  @ToNumberString()
  rg?: string;

  @ApiProperty({ example: '2024-12-20' })
  @IsDateString()
  @IsNotEmpty()
  @ToISO8601()
  dataNascimento: Date;

  @ApiProperty({ example: '11 111111111' })
  @IsPhoneNumber('BR')
  @IsNotEmpty()
  @ToNumberString()
  telefone: string;

  @ApiProperty({ example: '11 111111111' })
  @IsPhoneNumber('BR')
  @IsNotEmpty()
  @ToNumberString()
  whatsapp: string;

  @ApiProperty({ example: 'email@email.com', required: false })
  @IsOptional()
  @IsEmail()
  @ToLowerCase()
  email?: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  @IsNotEmpty()
  estrangeiro: boolean;

  @ApiProperty({ example: 'Masculino' })
  @IsString()
  @IsNotEmpty()
  @ToLowerCase()
  genero: string;

  @ApiProperty({ example: '12345678' })
  @IsString()
  @IsNotEmpty()
  @ToNumberString()
  cep: string;

  @ApiProperty({ example: 'sp' })
  @IsString()
  @IsNotEmpty()
  @ToLowerCase()
  uf: string;

  @ApiProperty({ example: 'São Paulo' })
  @IsString()
  @IsNotEmpty()
  municipio: string;

  @ApiProperty({ example: 'Rua das Flores' })
  @IsString()
  @IsNotEmpty()
  endereco: string;

  @ApiProperty({ example: 'Bairro das Flores' })
  @IsString()
  @IsNotEmpty()
  bairro: string;

  @ApiProperty({ example: '123' })
  @IsString()
  @IsNotEmpty()
  numero: string;

  @ApiProperty({ example: 'Complemento', required: false })
  @IsString()
  @IsOptional()
  complemento?: string;

  @ApiProperty({ example: 'Observações', required: false })
  @IsString()
  @IsOptional()
  observacoes?: string;

  
}

export class EditarClienteDto extends PartialType(CriarClienteDto) {}

export class ListarClienteDto {
  @ApiProperty({ example: '10', default: '1', required: false })
  @IsOptional()
  @IsNumberString()
  pagina: string;

  @ApiProperty({ example: '8', default: '10', required: false })
  @IsOptional()
  @IsNumberString()
  quantidade: string;

  @ApiProperty({ example: 'Pesquisa', default: '', required: false })
  @IsOptional()
  @IsString()
  pesquisa: string;

  @ApiProperty({
    example: '2024-06-17',
    required: false,
  })
  @IsString()
  @IsDateString()
  @IsOptional()
  @ToISO8601()
  dataInicial: Date;

  @ApiProperty({
    example: '2024-06-17',
    required: false,
  })
  @IsString()
  @IsDateString()
  @IsOptional()
  @ToISO8601()
  dataFinal: Date;

  @ApiProperty({ 
    example: 'masculino', 
    description: 'Filtro por gênero do cliente',
    required: false 
  })
  @IsOptional()
  @IsString()
  @ToLowerCase()
  genero?: string;

  @ApiProperty({ 
    example: 'sp', 
    description: 'Filtro por estado (UF) do cliente',
    required: false 
  })
  @IsOptional()
  @IsString()
  @ToLowerCase()
  estado?: string;

  @ApiProperty({ 
    example: 'whatsapp', 
    description: 'Filtro por canal de origem do atendimento',
    required: false 
  })
  @IsOptional()
  @IsString()
  @ToLowerCase()
  canalOrigem?: string;
}
