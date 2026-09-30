import { HttpStatus } from "@nestjs/common";
import { ApiBody, ApiProperty } from "@nestjs/swagger";


export class CadastrarLojaSucesso{
    @ApiProperty({ example: 'Operação realizada com sucesso' })
    message: string;
  

    @ApiProperty({ examples: [HttpStatus.OK] })
    statusCode: number;
  
    @ApiProperty()
    data: {};
  
}


export class CadastrarLojaMaRequisicao{
    @ApiProperty({ example: 'Má requisição para cadastro do lojista informando os possiveis erros nos campos: Email invalido,CNPJ invalido' })
    message: string;
  
    @ApiProperty({ examples: [HttpStatus.CONFLICT] })
    statusCode: number;
  
    @ApiProperty()
    data: {};
  
}

export class CadastrarLojaConflito{
    @ApiProperty({ example: 'Conflito de dados detectado' })
    message: string;
  
    @ApiProperty({ examples: [HttpStatus.CONFLICT] })
    statusCode: number;
  
    @ApiProperty()
    data: {};
  
}

