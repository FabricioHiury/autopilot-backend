import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class ListarPermissoesValidasSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string;

  @ApiProperty({ example: HttpStatus.OK })
  statusCode: number;

  @ApiProperty({
    type: [String],
    example: [
      'autopilotVerDashboard',
      'autopilotResponderTickets',
      'autopilotVerTickets',
      'autopilotBloquearAssinante',
      'autopilotVerAssinantes',
      'autopilotEditarAssinantesAdicionar',
      'autopilotAlterarPainelRevenda',
      'autopilotAtualizarPermissoes',
      'autopilotCriarUsuarioAdmin',
      'autopilotVerUsuariosAdmin',
    ],
  })
  data: string[];
}
