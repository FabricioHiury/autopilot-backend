import { ApiProperty } from '@nestjs/swagger';

class Message {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: null, nullable: true })
  userId: string | null;

  @ApiProperty({ example: 1 })
  chatId: string;

  @ApiProperty({ example: '559571956924781' })
  externalRecipientId: string;

  @ApiProperty({ example: null, nullable: true })
  externalMessageId: string | null;

  @ApiProperty({ example: null, nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ example: null, nullable: true })
  attachmentUrl: string | null;

  @ApiProperty({ example: null, nullable: true })
  attachmentType: string | null;

  @ApiProperty({ example: 'customer' })
  sender: string;

  @ApiProperty({ example: 'oi' })
  content: string;

  @ApiProperty({ example: 'instagram' })
  channel: string;

  @ApiProperty({ example: '2024-12-05T20:18:03.891Z' })
  createdAt: Date;
}

class DataListChats {
  @ApiProperty({ type: [Message] })
  messages: Message[];

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 'instagram' })
  channel: string;
}

export class ReplyListMessagesChatsSuccess {
  @ApiProperty({ example: 'Operation completed successfully.' })
  message: string;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ type: DataListChats })
  data: DataListChats;
}

export class ReplyListMessagesChatsNotFound {
  @ApiProperty({ example: 'None chat was found.' })
  message: string;

  @ApiProperty({ example: 404 })
  statusCode: number;

  @ApiProperty({})
  data: {};
}
