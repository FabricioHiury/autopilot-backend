import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, Matches, IsEnum, IsDateString, IsNumberString } from "class-validator";
import { ToISO8601 } from "src/utils/transformers/toISO8601.transformer";
import { PrioridadeTicketEnum } from "../enum/prioridade-ticket-enum";
import { StatusTicketEnum } from "../enum/status-ticket-enum";
import { CategoriaTicketEnum } from "../enum/categoria-ticket-enum";

export class ListarTicketDto {
    @ApiProperty({
        example: 'Nome do cliente',
        required: false,
        description:
          'Pesquisa por titulo ou nome do cliente',
      })
      @IsOptional()
      @IsString()
      pesquisa?: string;
    
    
      @ApiProperty({ example: PrioridadeTicketEnum.URGENTE, enum: PrioridadeTicketEnum, required: false })
      @IsOptional()
      @IsEnum(PrioridadeTicketEnum)
      prioridade?: PrioridadeTicketEnum;

      @ApiProperty({ example: StatusTicketEnum.RESOLUCAO, enum: StatusTicketEnum, required: false })
      @IsOptional()
      @IsEnum(StatusTicketEnum)
      status?: StatusTicketEnum;

      @ApiProperty({ example: CategoriaTicketEnum.CONTA, enum: CategoriaTicketEnum, required: false })
      @IsOptional()
      @IsEnum(CategoriaTicketEnum)
      categoria?: CategoriaTicketEnum;
    
      @ApiProperty({
        example: '2024-06-17',
        required: false,
      })
      @IsString()
      @IsDateString()
      @IsOptional()
      @ToISO8601()
      dataInicial: Date;
    
      @ApiProperty({
        example: '2024-06-17',
        required: false,
      })
      @IsString()
      @IsDateString()
      @IsOptional()
      @ToISO8601()
      dataFinal: Date;
    
      @ApiProperty({ example: '1', required: false })
      @IsOptional()
      @IsNumberString()
      pagina?: string;
    
      @ApiProperty({ example: '10', required: false })
      @IsOptional()
      @IsNumberString()
      itensPagina?: string;
}