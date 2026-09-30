import { HttpStatus } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { ListarCargosSucesso } from "../../../cargo/docs/endpoints/listar-cargos";


class CargoComFuncionalidadesArray {
    @ApiProperty({ example: 'Gerente' })
    cargo: string;
  
    @ApiProperty({ example: ['lojaVerAtendimentos', 'lojaVerDashboard'] })
    funcionalidades: string[];
  }
class BuscarColaboradorResposta {
    @ApiProperty({ example: 1 })
    id: string;
  
    @ApiProperty({ example: 1 })
    idLoja: string;
  
    @ApiProperty({ example: 3 })
    idUsuario: string;

    @ApiProperty({ example: 1 })
    idFoto: string | null;
  

    @ApiProperty({example:[{cargo:"Gerente",funcionalidades:["lojaVerAtendimentos","lojaVerDashboard"]}]})
    cargos: CargoComFuncionalidadesArray[];

    @ApiProperty({ example: 'colaborador souza' })
    nome: string;
  
    @ApiProperty({ example: '101.000.000-00' })
    documentoFiscal: string;

    @ApiProperty({ example: '(00) 00000-0000' })
    whatsapp: string;
  
    @ApiProperty({ example: '(00) 00000-0000' })
    telefoneComplementar: string;

    @ApiProperty({ example: 'ativo' })
    status: string;
  
    @ApiProperty({ example: 'Lorem ipsum dolor sit amet....' })
    observacoes: string | null;
  
    @ApiProperty({ example: '2024-09-27T19:10:29.356Z' })
    criadoEm: string;
  
    @ApiProperty({ example: '2024-09-30T18:56:28.092Z' })
    atualizadoEm: string;
}

class DataColaboradores {
    @ApiProperty({ example: 1 })
    pagina: number;

    @ApiProperty({ example: 10 })
    quantidade: number;

    @ApiProperty({ example: 2 })
    totalPaginas: number;

    @ApiProperty({ example: 11 })
    totalColaboradores: number;

    @ApiProperty({ type: BuscarColaboradorResposta, isArray: true })
    colaboradores: BuscarColaboradorResposta[];
}

export class BuscarColaboradoresSucesso {
    @ApiProperty({ example: 'Operação realizada com sucesso.' })
    message: string;
  
    @ApiProperty({ example: 200 })
    statusCode: number;

    @ApiProperty({ type: DataColaboradores })
    data: DataColaboradores;
}

export class BuscarColaboradoresErro {
    @ApiProperty({ example: 'Nenhum colaborador não encontrado.' })
    message: string;

    @ApiProperty({ example: HttpStatus.NOT_FOUND })
    statusCode: number;

    @ApiProperty()
    data: {}
}