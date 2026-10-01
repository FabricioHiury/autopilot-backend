import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IntegrationsEnum } from 'src/core/store/modules/chat/enum/channel.enum';
import { StatusIntegrationEnum } from 'src/utils/enum/statusIntegration.enum';

class StatusIntegrationOutputDto {
  @ApiProperty({ enum: IntegrationsEnum })
  channel: string;

  @ApiProperty({ enum: StatusIntegrationEnum })
  status: string;

  @ApiProperty({ example: 'Integration not configured' })
  message: string;
}

class StatusIntegrationsOutputDto {
  @ApiProperty({ type: StatusIntegrationOutputDto, isArray: true })
  statusIntegrations: StatusIntegrationOutputDto[];
}

export class StatusIntegrationsSuccess {
  @ApiProperty({ example: 'Operation completed with success' })
  message: string;

  @ApiProperty({ example: HttpStatus.OK })
  statusCode: number;

  @ApiProperty({ type: StatusIntegrationsOutputDto })
  data: StatusIntegrationsOutputDto;
}
