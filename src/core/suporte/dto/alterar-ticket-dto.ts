import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";
import { StatusTicketEnum } from "../enum/status-ticket-enum";

export class AlterarTicketDto {
    @ApiProperty({ example: StatusTicketEnum.RESOLUCAO, enum: StatusTicketEnum, required: false })
    @IsOptional()
    @IsEnum(StatusTicketEnum)
    status?: StatusTicketEnum;
}