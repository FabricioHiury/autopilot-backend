import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PERMISSIONS_STORE } from 'src/core/user/enum/permissions_features.enum';
import { USER_STATUS } from 'src/utils/enum/user-status.enum';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'email@gmail.com' })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Password@1234' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'Employee of Silva' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsOptional()
  idPhoto: string;

  @ApiProperty({ example: '000.000.000-00' })
  @IsString()
  @IsNotEmpty()
  taxId: string;

  @ApiProperty({ example: '(00) 00000-0000' })
  @IsString()
  @IsNotEmpty()
  whatsapp: string;

  @ApiProperty({ example: '(00) 00000-0000' })
  @IsString()
  @IsOptional()
  phoneAdditional: string;

  @ApiProperty({ example: 'Lorem ipsum dolor sit amet....' })
  @IsString()
  @IsOptional()
  notes: string;

  @ApiProperty({
    example: ['storeViewDashboard', 'storeViewDeals'],
    isArray: true,
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(PERMISSIONS_STORE, { each: true })
  features: PERMISSIONS_STORE[];

  @ApiProperty({
    example: [
      '550and8400-and29b-41d4-a716-446655440000',
      '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    ],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(4, { each: true })
  roles: string[];
}

export class EditEmployeeDto extends PartialType(CreateEmployeeDto) {}

export class EditStatusEmployeeDto {
  @IsString()
  @IsEnum(USER_STATUS)
  @IsNotEmpty()
  status: string;
}
