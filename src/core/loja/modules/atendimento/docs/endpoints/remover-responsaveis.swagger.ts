import { ApiProperty } from '@nestjs/swagger';

export class RemoverResponsaveisSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string;

  @ApiProperty({ example: 200 })
  statusCode: number;
}

export class RemoverResponsaveisErro {
  @ApiProperty({
    example: 'Nenhum dos responsáveis informados está vinculado ao atendimento',
  })
  message: string;

  @ApiProperty({ example: 400 })
  statusCode: number;
}
