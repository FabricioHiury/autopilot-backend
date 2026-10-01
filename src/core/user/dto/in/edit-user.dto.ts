import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  MinLength,
  IsOptional,
  IsString,
  IsIn,
  IsPhoneNumber,
  IsEnum,
} from 'class-validator';
import { USER_STATUS } from '../../../../utils/enum/user-status.enum';

export class EditUserDto {
  @ApiProperty({ example: 'mail@mail.com', required: false })
  @IsEmail()
  @IsOptional()
  email: string;

  @ApiProperty({ example: USER_STATUS.ACTIVE, required: false })
  @IsString()
  @IsOptional()
  @IsEnum(USER_STATUS)
  status: string;

  @ApiProperty({ example: 'Funcionario', required: false })
  @IsString()
  @MinLength(3)
  @IsOptional()
  name: string;
}
