import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IntegrationsEnum } from 'src/core/store/modules/chat/enum/channel.enum';

class ListIntegrationsOutputDto {
  @ApiProperty({ enum: IntegrationsEnum, isArray: true })
  integrations: IntegrationsEnum[];
}

export class ListIntegrationsSuccess {
  @ApiProperty({ example: 'Operation completed with success' })
  message: string;

  @ApiProperty({ example: HttpStatus.OK })
  statusCode: number;

  @ApiProperty({ type: ListIntegrationsOutputDto })
  data: ListIntegrationsOutputDto;
}
