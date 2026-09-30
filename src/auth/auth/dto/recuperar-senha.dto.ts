import { IsEmail, IsNotEmpty } from 'class-validator';

export class RecuperarSenhaDto {
  
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;
}