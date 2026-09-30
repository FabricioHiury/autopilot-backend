import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsStrongPassword  } from 'class-validator';

export class RedefinirSenhaDto {

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJlbWFpbCI6ImFkbWluQG1wLmNvbSJ9' })
  @IsNotEmpty()
  readonly token: string;

  @ApiProperty({ example: 'Senha@123'})
  @IsNotEmpty()
  @IsString()
  @IsStrongPassword()
  readonly senha: string;
}
