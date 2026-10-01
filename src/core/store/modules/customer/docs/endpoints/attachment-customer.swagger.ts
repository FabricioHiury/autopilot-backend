import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class AttachmentCustomerResponse {
  @ApiProperty({ example: 'www.url.com' })
  url: string;

  @ApiProperty({ example: '.pdf' })
  type: string;

  @ApiProperty({ example: 2 })
  fileId: string;
}

export class AttachmentCustomerSuccess {
  @ApiProperty({ example: 'Operation completed with success' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.OK] })
  statusCode: number;

  @ApiProperty()
  data: AttachmentCustomerResponse;
}

export class AttachmentCustomerBody {
  @ApiProperty({ example: File })
  file: File;
}
