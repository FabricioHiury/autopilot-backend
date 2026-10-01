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
import { TYPE_PERSON } from '../enum/customer.enum';
import { ToLowerCase } from 'src/utils/transformers/toLowerCase.transformer';
import { ToISO8601 } from 'src/utils/transformers/toISO8601.transformer';
import { ToNumberString } from 'src/utils/transformers/toNumberString.transformer';
import { IsUnique } from 'src/utils/validator/isUnique';

export class CustomerDTO {
  id: string;
  storeId: string;
  idPhoto?: string;
  name: string;
  typePerson: TYPE_PERSON;
  taxId: string;
  identityNumber?: string;
  foreigner: boolean;
  gender: string;
  birthDate: Date;
  notes?: string;
  phone: string;
  whatsapp: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CustomerAddressDto {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 1 })
  customerId: string;

  @ApiProperty({ example: '55555555' })
  postalCode: string;

  @ApiProperty({ example: 'sp' })
  state: string;

  @ApiProperty({ example: 'Sao Paulo' })
  city: string;

  @ApiProperty({ example: 'Sao Paulo' })
  address: string;

  @ApiProperty({ example: 'district' })
  district: string;

  @ApiProperty({ example: 1 })
  number: string;

  @ApiProperty({ example: 'Complement' })
  complement: string;

  @ApiProperty({ example: '2024-08-26T21:24:04.855Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-08-26T21:24:04.855Z' })
  updatedAt: Date;
}

export class CreateCustomerDto {
  @ApiProperty({ example: 'Jose of Silva' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'individual', enum: TYPE_PERSON })
  @IsEnum(TYPE_PERSON)
  @IsNotEmpty()
  typePerson: TYPE_PERSON;

  @ApiProperty({ example: '12345678910' })
  @IsString()
  @IsNotEmpty()
  // @IsUnique({ field: 'documentoFiscal', table: 'cliente' })
  @ToNumberString()
  taxId: string;

  @ApiProperty({ example: '123456789', required: false })
  @IsString()
  @IsOptional()
  @ToNumberString()
  identityNumber?: string;

  @ApiProperty({ example: '2024-12-20' })
  @IsDateString()
  @IsNotEmpty()
  @ToISO8601()
  birthDate: Date;

  @ApiProperty({ example: '11 111111111' })
  @IsPhoneNumber('BR')
  @IsNotEmpty()
  @ToNumberString()
  phone: string;

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
  foreigner: boolean;

  @ApiProperty({ example: 'Masculino' })
  @IsString()
  @IsNotEmpty()
  @ToLowerCase()
  gender: string;

  @ApiProperty({ example: '12345678' })
  @IsString()
  @IsNotEmpty()
  @ToNumberString()
  postalCode: string;

  @ApiProperty({ example: 'sp' })
  @IsString()
  @IsNotEmpty()
  @ToLowerCase()
  state: string;

  @ApiProperty({ example: 'São Paulo' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'Street of Flores' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'District of Flores' })
  @IsString()
  @IsNotEmpty()
  district: string;

  @ApiProperty({ example: '123' })
  @IsString()
  @IsNotEmpty()
  number: string;

  @ApiProperty({ example: 'Complement', required: false })
  @IsString()
  @IsOptional()
  complement?: string;

  @ApiProperty({ example: 'Notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class EditCustomerDto extends PartialType(CreateCustomerDto) {}

export class ListCustomerDto {
  @ApiProperty({ example: '10', default: '1', required: false })
  @IsOptional()
  @IsNumberString()
  page: string;

  @ApiProperty({ example: '8', default: '10', required: false })
  @IsOptional()
  @IsNumberString()
  limit: string;

  @ApiProperty({ example: 'Search', default: '', required: false })
  @IsOptional()
  @IsString()
  search: string;

  @ApiProperty({
    example: '2024-06-17',
    required: false,
  })
  @IsString()
  @IsDateString()
  @IsOptional()
  @ToISO8601()
  dataInitial: Date;

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
    description: 'Filter by gender of customer',
    required: false,
  })
  @IsOptional()
  @IsString()
  @ToLowerCase()
  gender?: string;

  @ApiProperty({
    example: 'sp',
    description: 'Filter by state (STATE) of customer',
    required: false,
  })
  @IsOptional()
  @IsString()
  @ToLowerCase()
  state?: string;

  @ApiProperty({
    example: 'whatsapp',
    description: 'Filter by channel of origin of deal',
    required: false,
  })
  @IsOptional()
  @IsString()
  @ToLowerCase()
  channelOrigin?: string;
}
