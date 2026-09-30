import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNumberString, IsOptional, IsString } from "class-validator";

export class ListarUsuariosDto {
    @ApiProperty({ example: '10', default: '1', required: false})
    @IsOptional()
    @IsNumberString()
    pagina: string;

    @ApiProperty({ example: '8', default: '10', required: false})
    @IsOptional()
    @IsNumberString()
    quantidade: string;

    @ApiProperty({ example: 'João', required: false})
    @IsOptional()
    @IsString()
    pesquisa: string;

    @ApiProperty({ example: 'todos', default: 'todos', required: false})
    @IsOptional()
    @IsString()
    @IsEnum(['todos', 'ativo', 'inativo'])
    status: string;
}