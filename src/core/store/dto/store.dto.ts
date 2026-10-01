import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  IsStrongPassword,
} from 'class-validator';
import { StatesBraziliansEnum } from 'src/utils/enum/states.enum';

export class LoginStoreOwnerDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email of storeOwner',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '@Password123',
    description: 'Password forte of storeOwner',
  })
  @IsStrongPassword()
  password: string;
}

export class StoreOwnerDataDto {
  @ApiProperty({ example: 1, description: 'ID unique of storeOwner' })
  @IsString()
  id: string;

  @ApiProperty({ example: 100, description: 'ID of user associated' })
  @IsString()
  userId: string;

  @ApiProperty({ example: true, description: 'Status of storeOwner' })
  @IsBoolean()
  status: boolean;
}

export class ListStoreResponse {
  @ApiProperty({
    example: 'Name of Company',
    description: 'Name of company cadastrada',
  })
  companyName: string;

  @ApiProperty({
    example: '0000.0000/0000-00',
    description: 'TAXID of company',
  })
  taxId: string;
}

export class ListStoreDto {
  @ApiPropertyOptional({
    example: 'Search',
    default: '',
    description: 'Term of search',
    required: false,
  })
  @IsOptional()
  @IsString()
  search: string;

  @ApiPropertyOptional({
    example: '1',
    default: '1',
    description: 'Number of page',
    required: false,
  })
  @IsOptional()
  @IsNumberString()
  page: string;

  @ApiPropertyOptional({
    example: '10',
    default: '10',
    description: 'Limit of items by page',
    required: false,
  })
  @IsOptional()
  @IsNumberString()
  limit: string;
}

export class RegistrationStoreOwnerDto {
  @ApiProperty({ example: 'mail@mail.com', description: 'Email of storeOwner' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '@Password123',
    description: 'Password forte of storeOwner',
  })
  @IsString()
  @IsStrongPassword()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    example: '0000.0000.00/0000-00',
    description: 'Document tax of company',
  })
  @IsNotEmpty()
  taxId: string;

  @ApiProperty({
    example: 'Fulano Oliveira',
    description: 'Name complete of storeOwner',
  })
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'CE',
    enum: StatesBraziliansEnum,
    description: 'Unidade Federativa (STATE)',
  })
  @IsNotEmpty()
  state: StatesBraziliansEnum;

  @ApiProperty({
    example: 'Crato',
    description: 'City where a company is located',
  })
  @IsNotEmpty()
  city: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Status of storeOwner',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  status: boolean = true;

  @ApiPropertyOptional({
    example: 'João Silva',
    description: 'Name of assignee by the account',
  })
  @IsString()
  @IsOptional()
  assignee?: string;

  @ApiPropertyOptional({
    example: '11987654321',
    description: 'Phone/WhatsApp of contact',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    example: '12345-678',
    description: 'POSTALCODE of address',
  })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiPropertyOptional({
    example: 'Street of Flores',
    description: 'Name of street',
  })
  @IsString()
  @IsOptional()
  street?: string;

  @ApiPropertyOptional({ example: '123', description: 'Number of address' })
  @IsString()
  @IsOptional()
  number?: string;

  @ApiPropertyOptional({
    example: 'Apto 101',
    description: 'Complement of address',
  })
  @IsString()
  @IsOptional()
  complement?: string;

  @ApiPropertyOptional({ example: 'Centro', description: 'District' })
  @IsString()
  @IsOptional()
  district?: string;
}

export class RegistrationAddressDto {
  @ApiProperty({
    example: 1,
    description: 'Must be provided case want to edit a address',
    required: false,
  })
  @IsOptional()
  @IsString()
  idAddress?: string;

  @ApiPropertyOptional({
    example: 'Street Exemplo',
    description: 'Name of street',
    required: false,
  })
  @IsString()
  @IsOptional()
  street?: string;

  @ApiPropertyOptional({
    example: '12345-678',
    description: 'POSTALCODE',
    required: false,
  })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiProperty({ example: 'São Paulo', description: 'City' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({
    example: 'SP',
    enum: StatesBraziliansEnum,
    description: 'Unidade Federativa (STATE)',
  })
  @IsEnum(StatesBraziliansEnum)
  @IsNotEmpty()
  state: string;

  @ApiPropertyOptional({
    example: 'District Exemplo',
    description: 'District',
    required: false,
  })
  @IsString()
  @IsOptional()
  district?: string;

  @ApiPropertyOptional({
    example: '1000',
    description: 'Number of residence',
    required: false,
  })
  @IsString()
  @IsOptional()
  number?: string;

  @ApiPropertyOptional({
    example: 'Apto 101',
    description: 'Complement',
    required: false,
  })
  @IsOptional()
  @IsString()
  complement?: string;

  @ApiProperty({ example: true, description: 'Indicates if is a branch' })
  @IsBoolean()
  @IsNotEmpty()
  branch: boolean;
}

export class EditContactDto {
  @ApiProperty({
    example: 1,
    description: 'Must be provided case want to edit a contact',
    required: false,
  })
  @IsOptional()
  @IsString()
  idContact?: string;

  @ApiProperty({
    example: 'www.siteexemplo.com',
    description: 'Website of store',
    required: false,
  })
  @IsOptional()
  @IsString()
  site?: string;

  @ApiProperty({ example: 'João Silva', description: 'Name of contact' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: '(11) 91234-5678', description: 'Number of mobile' })
  @IsNotEmpty()
  @IsString()
  mobile: string;

  @ApiProperty({
    example: '(11) 1234-5678',
    description: 'Number of phone landline',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    example: 'contact@lojaexemplo.com',
    description: 'Email of contact',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class EditStoreDto {
  @ApiProperty({
    example: 'Name of Company',
    description: 'Name of company owner',
    required: false,
  })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ example: '', required: false })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiProperty({
    example: '123456',
    description: 'Registration Municipal',
    required: false,
  })
  @IsNotEmpty()
  @IsOptional()
  registrationMunicipal?: string;

  @ApiProperty({
    example: '789012',
    description: 'Registration State',
    required: false,
  })
  @IsOptional()
  @IsNotEmpty()
  registrationState?: string;

  @ApiProperty({
    example: 'Simple Nacional',
    description: 'Regime tax',
    required: false,
  })
  @IsOptional()
  @IsNotEmpty()
  regimeTax?: string;

  @ApiProperty({
    example: 'www.portalempresa.com',
    description: 'Portal of company',
    required: false,
  })
  @IsOptional()
  @IsNotEmpty()
  portalCompany?: string;

  @ApiProperty({
    example: 'Commerce Varejista',
    description: 'Activity primary',
    required: false,
  })
  @IsOptional()
  @IsNotEmpty()
  activityPrimary?: string;

  @ApiProperty({
    example: 'Description detailed of activity',
    description: 'Description of activity',
    required: false,
  })
  @IsOptional()
  @IsNotEmpty()
  descriptionActivity?: string;
}
