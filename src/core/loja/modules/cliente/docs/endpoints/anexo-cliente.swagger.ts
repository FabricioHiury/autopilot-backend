import { HttpStatus } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";



export class AnexoClienteResponse{

    @ApiProperty({example:"www.url.com"})
    url:string


    @ApiProperty({example:".pdf"})
    tipo:string


    @ApiProperty({example:2})
    idArquivo:string
}
  
export class AnexoClienteSucesso {
    @ApiProperty({ example: 'Operação realizada com sucesso' })
    message: string;
  
    @ApiProperty({ examples: [HttpStatus.OK] })
    statusCode: number;
  
    @ApiProperty()
    data: AnexoClienteResponse;
  }
  
export class AnexoClienteBody {
    @ApiProperty({ example: File })
    file: File;
}
