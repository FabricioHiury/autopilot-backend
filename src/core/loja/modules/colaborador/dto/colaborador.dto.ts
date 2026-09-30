import { ApiProperty, PartialType } from "@nestjs/swagger";
import { ArrayNotEmpty, IsArray, IsEnum, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from "class-validator";
import { PERMISSOES_LOJA } from "src/core/usuario/enum/permissoes_funcionalidades.enum";
import { USUARIO_STATUS } from "src/utils/enum/usuario-status.enum";

export class CriarColaboradorDto {
    @ApiProperty({example: 'email@gmail.com'})
    @IsString()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example:'Senha@1234'})
    @IsString()
    @IsNotEmpty()
    senha: string;

    @ApiProperty({example: 'Colaborador da Silva'})
    @IsString()
    @IsNotEmpty()
    nome: string;

    @ApiProperty({example: 1})
    @IsNumber()
    @IsOptional()
    idFoto: string
    
    @ApiProperty({example: '000.000.000-00'})
    @IsString()
    @IsNotEmpty()
    documentoFiscal: string;

    @ApiProperty({example: '(00) 00000-0000'})
    @IsString()
    @IsNotEmpty()
    whatsapp: string;

    @ApiProperty({example: '(00) 00000-0000'})
    @IsString()
    @IsOptional()
    telefoneComplementar: string;

    @ApiProperty({example: 'Lorem ipsum dolor sit amet....'})
    @IsString()
    @IsOptional()
    observacoes: string;

    @ApiProperty({ example: ['lojaVerDashboard', 'lojaVerAtendimentos'], isArray: true })
    @IsArray()
    @ArrayNotEmpty()
    @IsEnum(PERMISSOES_LOJA, { each: true })
    funcionalidades: PERMISSOES_LOJA[];

    @ApiProperty({example: ['550e8400-e29b-41d4-a716-446655440000', '6ba7b810-9dad-11d1-80b4-00c04fd430c8']})
    @IsArray()
    @ArrayNotEmpty()
    @IsUUID(4, { each: true })
    cargos: string[];
}

export class EditarColaboradorDto extends PartialType(CriarColaboradorDto) {}

export class EditarStatusColaboradorDto {
    @IsString()
    @IsEnum(USUARIO_STATUS)
    @IsNotEmpty()
    status: string;

}