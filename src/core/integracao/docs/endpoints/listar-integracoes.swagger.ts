import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IntegracoesEnum } from 'src/core/loja/modules/chat/enum/canal.enum';

class ListarIntegracoesSaidaDto {
  @ApiProperty({ enum: IntegracoesEnum, isArray: true })
  integracoes: IntegracoesEnum[];
}

export class ListarIntegracoesSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string;

  @ApiProperty({ example: HttpStatus.OK })
  statusCode: number;

  @ApiProperty({ type: ListarIntegracoesSaidaDto })
  data: ListarIntegracoesSaidaDto;
}
