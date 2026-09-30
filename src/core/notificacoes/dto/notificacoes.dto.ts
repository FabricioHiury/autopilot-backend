import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum, IsNumber, IsString, IsOptional } from 'class-validator';
import {
  StatusNotificacaoEnum,
  TiposNotificacaoEnum,
} from 'src/utils/enum/notificacoes.enum'; // Ajuste o caminho conforme necessário

export class AlterarStatusNotificacaoDto {
  @ApiProperty({
    description: 'Status da notificação a ser alterado',
    example: StatusNotificacaoEnum.VISUALIZADO,
    enum:StatusNotificacaoEnum // Ajuste conforme os valores do seu enum
  })
  @IsNotEmpty()
  @IsEnum(StatusNotificacaoEnum)
  status: StatusNotificacaoEnum;
}

export class ListarNotificacaoDto {
  @ApiProperty({
    description: 'Status da notificação',
    example: StatusNotificacaoEnum.VISUALIZADO,
    enum:StatusNotificacaoEnum // Ajuste conforme os valores do seu enum
  })
  @IsOptional()
  @IsEnum(StatusNotificacaoEnum)
  status?: StatusNotificacaoEnum;
}


export class CriarNotificacaoDto {
  @ApiProperty({
    description: 'ID do usuário que receberá a notificação',
    example: 1,
  })
  @IsNumber()
  idUsuario: string;

  @ApiProperty({
    description: 'ID do objeto da notificação',
    example: 10,
  })
  @IsNumber()
  @IsOptional()
  idReferencia?: string;

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
