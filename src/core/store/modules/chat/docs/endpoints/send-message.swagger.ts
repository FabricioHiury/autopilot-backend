import { ApiProperty } from '@nestjs/swagger';

class MessageSent {
  @ApiProperty({ example: 47 })
  id: string;

  @ApiProperty({ example: 1 })
  userId: string;

  @ApiProperty({ example: 18 })
  chatId: string;

  @ApiProperty({ example: '8743894685696123' })
  externalRecipientId: string;

  @ApiProperty({ example: null, nullable: true })
  externalMessageId: string | null;

  @ApiProperty({ example: null, nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ example: '', nullable: true })
  attachmentUrl: string | null;

  @ApiProperty({ example: null, nullable: true })
  attachmentType: string | null;

  @ApiProperty({ example: 'store' })
  sender: string;

  @ApiProperty({ example: 'message' })
  content: string;

  @ApiProperty({ example: 'facebook' })
  channel: string;

  @ApiProperty({ example: '2024-12-06T18:07:13.795Z' })
  createdAt: Date;
}

export class ReplySendMessageSuccess {
  @ApiProperty({ example: 'Operation completed successfully.' })
  message: string;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ type: MessageSent })
  data: MessageSent;
}

export class ReplySendMessageBadRequest {
  @ApiProperty({ example: 'Failed to send message.' })
  message: string;

  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({})
  data: {};
}
