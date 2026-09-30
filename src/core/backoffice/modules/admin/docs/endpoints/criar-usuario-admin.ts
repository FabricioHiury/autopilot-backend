import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';

export class SaidaUsuarioAdmin {
  @ApiProperty({ example: 5 })
  id: string;

  @ApiProperty({ example: 'admin@email.com' })
  email: string;

  @ApiProperty({ example: 'Admin da Silva' })
  nome: string;

  @ApiProperty({ example: 'ativo' })
  status: string;

  @ApiProperty({ example: 'autopilot' })
  perfil: string;

  @ApiProperty({ example: 'https://img.com' })
  avatarUrl: string | null;

  @ApiProperty({
    example: [
      'autopilotVerAssinantes',
      'autopilotBloquearAssinante',
      'autopilotVerDashboard',
    ],
  })
  permissoes: string[];
}

export class CriarUsuarioAdminSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string;

  @ApiProperty({ example: HttpStatus.CREATED })
  statusCode: number;

  @ApiProperty({ type: SaidaUsuarioAdmin })
  data: SaidaUsuarioAdmin;
}
