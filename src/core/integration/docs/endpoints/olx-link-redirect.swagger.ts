import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class OlxLinkRedirectSuccess {
  @ApiProperty({ example: 'Operation completed with success' })
  message: string;

  @ApiProperty({ example: HttpStatus.OK })
  statusCode: number;

  @ApiProperty({
    example:
      'https://autopilot-integrations.um1vpc.easypanel.host/olx/auth/key-access',
  })
  data: string;
}
