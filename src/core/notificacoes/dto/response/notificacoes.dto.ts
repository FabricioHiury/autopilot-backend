import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum, IsNumber, IsString } from 'class-validator';
import {
  StatusNotificacaoEnum,
  TiposNotificacaoEnum,
} from 'src/utils/enum/notificacoes.enum';

export class ListarNotificacaoResonseDto {
  @ApiProperty({
    description: 'ID da notificação',
    example: 1,
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Status da notificação',
    example: StatusNotificacaoEnum.VISUALIZADO,
  })
  @IsNotEmpty()
  @IsEnum(StatusNotificacaoEnum)
  status: StatusNotificacaoEnum;

  @ApiProperty({
    description: 'Tipo da notificação',
    example: TiposNotificacaoEnum.NOVO_ATENDIMENTO,
  })
  @IsEnum(TiposNotificacaoEnum)
  tipo: TiposNotificacaoEnum;

  @ApiProperty({
    description: 'Mensagem da notificação',
    example: 'Sua assinatura foi renovada com sucesso!',
  })
  @IsString()
  mensagem: string;
}
