import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class LoginDto {
    
    @ApiProperty({ example: 'eyJhbGci'})
    @Expose()
    token: string;
}

export class ResponseLoginDto {
    
    @ApiProperty({ example: 'Login efetuado com sucesso' })
    @Expose()
    message: string;

    @ApiProperty({ example: 200 })
    @Expose()
    status: number;
    
    @ApiProperty({ type: LoginDto })
    @Expose()
    data: LoginDto;
}
