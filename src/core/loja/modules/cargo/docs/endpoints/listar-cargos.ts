import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

class CargoComFuncionalidadesArray {
  @ApiProperty({ example: 'Gerente' })
  cargo: string;

  @ApiProperty({ example: ['lojaVerAtendimentos', 'lojaVerDashboard'] })
  funcionalidades: string[];
}

class ListarCargosSaida {
  @ApiProperty({ type: [CargoComFuncionalidadesArray] })
  cargos: CargoComFuncionalidadesArray[];
}

export class ListarCargosSucesso {
  @ApiProperty({ example: 'Cargo criado com sucesso' })
  message: string;

  @ApiProperty({ example: HttpStatus.OK })
  status: number;

  @ApiProperty({ type: ListarCargosSaida })
  data: ListarCargosSaida;
}
