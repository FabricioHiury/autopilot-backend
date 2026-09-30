import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IntegracoesEnum } from 'src/core/loja/modules/chat/enum/canal.enum';
import { StatusIntegracaoEnum } from 'src/utils/enum/statusIntegracao.enum';

class StatusIntegracaoSaidaDto {
  @ApiProperty({ enum: IntegracoesEnum })
  canal: string;

  @ApiProperty({ enum: StatusIntegracaoEnum })
  status: string;

  @ApiProperty({ example: 'Integração não configurada' })
  mensagem: string;
}

class StatusIntegracoesSaidaDto {
  @ApiProperty({ type: StatusIntegracaoSaidaDto, isArray: true })
  statusIntegracoes: StatusIntegracaoSaidaDto[];
}

export class StatusIntegracoesSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string;

  @ApiProperty({ example: HttpStatus.OK })
  statusCode: number;

  @ApiProperty({ type: StatusIntegracoesSaidaDto })
  data: StatusIntegracoesSaidaDto;
}
