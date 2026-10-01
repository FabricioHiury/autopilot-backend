import { ApiProperty } from '@nestjs/swagger';

class Employee {
  @ApiProperty({ example: 1 })
  userId: string;

  @ApiProperty({ example: 'Name of Employee' })
  name: string;
}

class DealAssignee {
  @ApiProperty({ type: Employee })
  employee: Employee;
}

class Deal {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 'status' })
  status: string;

  @ApiProperty({ type: [DealAssignee] })
  dealAssignee: DealAssignee[];
}

class TemporaryCustomer {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: null, nullable: true })
  dealId: string | null;

  @ApiProperty({ example: null, nullable: true })
  avatar: string | null;

  @ApiProperty({ example: null, nullable: true })
  name: string | null;

  @ApiProperty({ example: null, nullable: true })
  email: string | null;

  @ApiProperty({ example: null, nullable: true })
  whatsapp: string | null;

  @ApiProperty({ example: 'instagram' })
  channel: string;

  @ApiProperty({ example: '559571956924781' })
  externalContactId: string;

  @ApiProperty({ example: '2024-12-05T20:18:03.639Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-12-05T20:18:03.639Z' })
  updatedAt: Date;
}

class Chat {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 1 })
  storeId: string;

  @ApiProperty({ example: null, nullable: true })
  customerId: string | null;

  @ApiProperty({ example: 1 })
  temporaryCustomerId: string;

  @ApiProperty({ example: null, nullable: true })
  dealId: string | null;

  @ApiProperty({ example: '559571956924781' })
  externalRecipientId: string;

  @ApiProperty({ example: 'instagram' })
  channel: string;

  @ApiProperty({ example: '2024-12-05T20:18:03.820Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-12-05T20:18:03.820Z' })
  updatedAt: Date;

  @ApiProperty({ type: TemporaryCustomer, nullable: true })
  temporaryCustomer: TemporaryCustomer | null;

  @ApiProperty({ example: null, nullable: true })
  customer: any | null;

  @ApiProperty({ type: Deal, nullable: true })
  deal: Deal | null;
}

class DataListChats {
  @ApiProperty({ type: [Chat] })
  chats: Chat[];

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;
}

export class ReplyListChatsSuccess {
  @ApiProperty({ example: 'Operation completed successfully.' })
  message: string;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ type: DataListChats })
  data: DataListChats;
}

export class ReplyListChatsNotFound {
  @ApiProperty({ example: 'None chat found.' })
  message: string;

  @ApiProperty({ example: 404 })
  statusCode: number;

  @ApiProperty({})
  data: {};
}
