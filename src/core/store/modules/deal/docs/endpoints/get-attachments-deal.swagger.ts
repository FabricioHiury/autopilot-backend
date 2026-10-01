import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

class AttachmentFormatted {
  @ApiProperty({ example: 1 })
  idAttachment: string;

  @ApiProperty({ example: 'https://img.com' })
  url: string;
}

class GetAttachmentsDealOutput {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  itemsPage: number;

  @ApiProperty({ example: 1 })
  totalPages: number;

  @ApiProperty({ type: [AttachmentFormatted] })
  attachments: AttachmentFormatted[];
}

export class GetAttachmentsDealSuccess {
  @ApiProperty({ example: 'Operation completed successfully.' })
  message: string;

  @ApiProperty({ example: HttpStatus.OK })
  statusCode: number;

  @ApiProperty({ type: GetAttachmentsDealOutput })
  data: GetAttachmentsDealOutput;
}
