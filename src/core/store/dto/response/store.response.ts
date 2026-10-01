import { ApiProperty } from '@nestjs/swagger';
import { RegistrationAddressDto, EditContactDto } from '../store.dto';

export class StoreOwnerOutputDto {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 'Fulano Oliveira' })
  name: string;
}

export class UserDto {
  @ApiProperty({ example: 'teste5@mail.com' })
  email: string;

  @ApiProperty({ example: 'test' })
  name: string;

  @ApiProperty({ example: '2024-09-25T11:36:08.973Z' })
  createdAt: string;
}

export class StoreOwnerDetailsDto {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: true })
  status: boolean;

  @ApiProperty({ type: UserDto })
  user: UserDto;
}

export class DetailsStoreDto {
  @ApiProperty({
    description: 'Addresses of store',
    type: RegistrationAddressDto,
    isArray: true,
  })
  storeAddress: RegistrationAddressDto[];

  @ApiProperty({
    description: 'Data of storeOwner',
    type: StoreOwnerDetailsDto,
  })
  storeOwner: StoreOwnerDetailsDto;

  @ApiProperty({ example: 'Store Exemplo' })
  companyName: string;

  @ApiProperty({
    description: 'Assignees by the deal',
    example: ['João', 'Maria'],
  })
  dealAssignee: string[];

  @ApiProperty({ example: 'Activity of Commerce Varejista' })
  activityPrimary: string;

  @ApiProperty({ example: '00.000.000/0000-00' })
  taxId: string;

  @ApiProperty({
    description: 'List of employees of store',
    example: ['Employee 1', 'Employee 2'],
  })
  employee: string[];

  @ApiProperty({
    description: 'Information of contact of store',
    type: EditContactDto,
  })
  storeContact: EditContactDto;

  @ApiProperty({
    description: 'Description of activities of store',
    example: 'Description detailed of activities of store',
  })
  descriptionActivity: string;

  @ApiProperty({
    description: 'Registration State',
    example: '1234567890',
  })
  registrationState: string;

  @ApiProperty({
    description: 'Registration Municipal',
    example: '0987654321',
  })
  registrationMunicipal: string;

  @ApiProperty({
    description: 'Portal of company',
    example: 'www.lojaexemplo.com',
  })
  portalCompany: string;

  @ApiProperty({
    description: 'Regime Tax of company',
    example: 'Simple Nacional',
  })
  regimeTax: string;
}

export class DetailsStoreListDto {
  @ApiProperty({
    description: 'Addresses of store',
    type: RegistrationAddressDto,
    isArray: true,
  })
  storeAddress: RegistrationAddressDto[];

  @ApiProperty({
    description: 'Data of storeOwner',
    type: StoreOwnerDetailsDto,
  })
  storeOwner: StoreOwnerDetailsDto;

  @ApiProperty({ example: 'Store Exemplo' })
  companyName: string;

  @ApiProperty({ example: '00.000.000/0000-00' })
  taxId: string;

  @ApiProperty({
    description: 'Information of contact of store',
    type: EditContactDto,
  })
  storeContact: EditContactDto;
}

export class ListStoreOutputDto {
  @ApiProperty({ example: 'Lucas' })
  search: string;

  @ApiProperty({ example: 1 })
  page: number;
  @ApiProperty({ example: 3 })
  totalPages: number;
  @ApiProperty({ example: 22 })
  totalStores: number;
  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ type: [DetailsStoreListDto] })
  stores: [DetailsStoreListDto];
}
