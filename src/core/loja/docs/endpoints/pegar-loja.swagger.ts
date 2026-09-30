import { ApiProperty } from "@nestjs/swagger";
import { DetalhesLojaDto } from "../../dto/response/loja.response";
import { HttpStatus } from "@nestjs/common";

export class PegarLojaSucesso{
    @ApiProperty({ example: 'Operação realizada com sucesso' })
    message: string;
  

    @ApiProperty({ examples: [HttpStatus.OK] })
    statusCode: number;

    @ApiProperty({type:DetalhesLojaDto})
    data: DetalhesLojaDto;
}

export class PegarLojaNaoEncontrado{
    @ApiProperty({ example: 'Loja não encontrada' })
    message: string;
  

    @ApiProperty({ examples: [HttpStatus.NOT_FOUND] })
    statusCode: number;

    @ApiProperty({})
    data: {};
}
