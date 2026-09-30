import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class ResponderTicketDto {
    @ApiProperty({ example: 'Solicitação resolvida', })
    @IsString()
    resposta: string;
}