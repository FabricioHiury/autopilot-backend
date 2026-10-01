import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsStrongPassword,
  IsNotEmpty,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { USER_PROFILE } from '../../enum/profile.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'mail@mail.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsStrongPassword()
  @IsNotEmpty()
  password: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  name: string;

  @ApiProperty({ enum: USER_PROFILE })
  @IsString()
  @IsEnum(USER_PROFILE)
  profile: string;
}
