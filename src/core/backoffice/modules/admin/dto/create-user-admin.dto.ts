import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  Validate,
} from 'class-validator';
import { PERMISSIONS_AUTOPILOT } from 'src/core/user/enum/permissions_features.enum';
import { IsInEnum } from '../utils/admin.utils';

export class CreateUserAdminDto {
  @ApiProperty({ example: 'João of Silva' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'joao@email.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Password@123' })
  @IsStrongPassword()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    example:
      'Instructions additional for be sent in email to user that will be registered.',
  })
  @IsString()
  @IsOptional()
  notes: string;

  @ApiProperty({
    example: ['autopilotViewSubscribers', 'autopilotViewDashboard'],
    isArray: true,
    type: String,
    enum: PERMISSIONS_AUTOPILOT,
  })
  @IsArray()
  @IsNotEmpty({ each: true })
  @IsString({ each: true })
  @Validate(IsInEnum, { each: true })
  permissions: string[];
}
