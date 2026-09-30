import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class SalvarAvatarSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.OK] })
  statusCode: number;

  @ApiProperty({
    example: 'http://linkavatar.com.br/avatar/usuario/1',
  })
  data: string;
}

export class SalvarAvatarBadRequest {
  @ApiProperty({
    example:
      'Tipo de arquivo inválido. São aceitos um dos seguintes tipos: image/jpeg, image/jpg, image/webp, image/png',
  })
  message: string;

  @ApiProperty({ examples: [HttpStatus.BAD_REQUEST] })
  statusCode: number;

  @ApiProperty()
  data: {};
}
