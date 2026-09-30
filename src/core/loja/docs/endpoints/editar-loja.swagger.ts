import { HttpStatus } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { EditarLojaDto } from "../../dto/loja.dto";


export class EditarLojaSucesso{
    @ApiProperty({ example: 'Operação realizada com sucesso' })
    message: string;
  
    @ApiProperty({ examples: [HttpStatus.OK] })
    statusCode: number;
  
    @ApiProperty({})
    data: EditarLojaDto;
}