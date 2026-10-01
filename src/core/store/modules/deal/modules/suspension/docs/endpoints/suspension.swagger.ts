import { ApiProperty } from '@nestjs/swagger';

class UserSuspension {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 'João Silva' })
  name: string;

  @ApiProperty({ example: 'joao.silva@email.com' })
  email: string;

  @ApiProperty({ example: { file: { url: 'https://example.com/avatar.jpg' } } })
  avatar?: { file: { url: string } };
}

class SuspensionData {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 1 })
  userId: string;

  @ApiProperty({ example: 'User at period of vacation' })
  description: string;

  @ApiProperty({ example: '2024-06-01T00:00:00.000Z' })
  startDate: Date;

  @ApiProperty({ example: '2024-06-15T23:59:59.000Z' })
  endDate: Date;

  @ApiProperty({ example: '2024-05-25T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-05-25T12:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ type: UserSuspension })
  user: UserSuspension;
}

class Meta {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 25 })
  total: number;

  @ApiProperty({ example: 3 })
  pages: number;
}

export class SuspensionSuccess {
  @ApiProperty({ example: 'Operation completed successfully.' })
  message: string;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ type: SuspensionData })
  data: SuspensionData;
}

export class ListSuspensionsSuccess {
  @ApiProperty({ example: 'Operation completed successfully.' })
  message: string;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ type: [SuspensionData] })
  data: SuspensionData[];

  @ApiProperty({ type: Meta })
  meta: Meta;
}

export class RemoveSuspensionSuccess {
  @ApiProperty({ example: 'Suspension removed with success.' })
  message: string;

  @ApiProperty({ example: 200 })
  statusCode: number;
}

export class CheckSuspensionSuccess {
  @ApiProperty({ example: 'Operation completed successfully.' })
  message: string;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: { suspended: true } })
  data: { suspended: boolean };
}
