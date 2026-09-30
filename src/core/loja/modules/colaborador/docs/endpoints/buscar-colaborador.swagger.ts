import { HttpStatus } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";

class BuscarColaboradorResposta {
    @ApiProperty({ example: 2 })
    id: string;
  
    @ApiProperty({ example: 1 })
    idLoja: string;
  
    @ApiProperty({ example: 1})
    idUsuario: string;

    @ApiProperty({ example: null })
    idFoto: string | null;
  
    @ApiProperty({ example: 'Jose da Silva' })
    nome: string;
  
    @ApiProperty({ example: '1222345678910' })
    documentoFiscal: string;

    @ApiProperty({ example: '18996496212' })
    whatsapp: string;
  
    @ApiProperty({ example: '18996496212' })
    telefoneComplementar: string;

    @ApiProperty({ example: 'ativo' })
    status: string;
  
    @ApiProperty({ example: null })
    observacoes: string | null;
  
    @ApiProperty({ example: '2024-10-03T16:39:02.820Z' })
    criadoEm: string;
  
    @ApiProperty({ example: '2024-10-03T16:39:02.820Z' })
    atualizadoEm: string;
}

export class BuscarColaboradorSucesso {
    @ApiProperty({ example: 'Operação realizada com sucesso' })
    message: string;
  
    @ApiProperty({ example: HttpStatus.OK })
    statusCode: number;

    @ApiProperty({ type: BuscarColaboradorResposta })
    data: BuscarColaboradorResposta
}

export class BuscarColaboradorErro {
    @ApiProperty({ example: 'Colaborador não encontrado.' })
    message: string;
  
    @ApiProperty({ example: HttpStatus.NOT_FOUND })
    statusCode: number;

    @ApiProperty()
    data: {}
}