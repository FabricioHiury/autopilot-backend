import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class LoginDto {
    @ApiProperty({ example:'admin@mail.com' })
    @IsNotEmpty()
    @IsString()
    email: string;

    @ApiProperty({ example:'Senha@1234'})
    @IsNotEmpty()
    @IsString()
    senha: string;

    @ApiProperty({ 
        example: 'ExponentPushToken[xxxxxx]',
        required: false,
        description: 'Expo Push Token do dispositivo móvel para notificações push'
    })
    @IsOptional()
    @IsString()
    expoPushToken?: string;
}
