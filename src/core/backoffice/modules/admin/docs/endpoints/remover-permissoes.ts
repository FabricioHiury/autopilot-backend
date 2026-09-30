import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { SaidaUsuarioAdmin } from './criar-usuario-admin';

export class RemoverPermissoesSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string;

  @ApiProperty({ example: HttpStatus.OK })
  statusCode: number;

  @ApiProperty({ type: SaidaUsuarioAdmin })
  data: SaidaUsuarioAdmin;
}
