import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@mail.com' })
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty({ example: 'Password@1234' })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({
    example: 'ExponentPushToken[xxxxxx]',
    required: false,
    description: 'Expo Push Token of mobile device for notifications push',
  })
  @IsOptional()
  @IsString()
  expoPushToken?: string;
}
