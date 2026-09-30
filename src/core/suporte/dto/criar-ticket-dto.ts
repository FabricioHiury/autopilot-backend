import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class CriarTicketDto {
    @ApiProperty({ example: 'Excesso de cobrança', })
    @IsString()
    titulo: string;

    @ApiProperty({ example: 'Reclamação', })
    @IsString()
    categoria: string;

    @ApiProperty({ example: 'Descrição rápida da mensagem', })
    @IsString()
    assunto: string;

    @ApiProperty({ example: 'Conteúdo da reclamação', })
    @IsString()
    mensagem: string;
}