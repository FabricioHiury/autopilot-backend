import { HttpStatus } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ORIGIN_DEAL, STATUS_DEAL } from 'src/utils/enum/deal.enum';

class CustomerWithAvatar {
  @ApiProperty({ example: 6 })
  id: string;

  @ApiProperty({ example: '9999999999' })
  whatsapp: string;

  @ApiProperty({ example: 'email@email.co,' })
  email: string;

  @ApiPropertyOptional({
    example: 'http://localhost:3003/avatar/user/3',
    nullable: true,
  })
  avatarUrl?: string;
}

class TemporaryCustomer {
  @ApiProperty({ example: 6 })
  id: string;

  @ApiProperty({ example: '9999999999' })
  whatsapp: string;

  @ApiProperty({ example: 'email@email.co,' })
  email: string;

  @ApiPropertyOptional({
    example: 'http://localhost:3003/avatar/user/3',
    nullable: true,
  })
  avatar?: string;
}

class AssigneeWithRoles {
  @ApiProperty({ example: 2 })
  employeeId: string;

  @ApiProperty({ example: 'João Silva' })
  name: string;

  @ApiProperty({ example: 'http://localhost:3003/avatar/user/3' })
  avatarUrl: string;

  @ApiProperty({ example: '' })
  roles: string;
}

class CommentWithUser {
  @ApiProperty({ example: 1 })
  idComment: string;

  @ApiProperty({ example: 2 })
  userId: string;

  @ApiProperty({ example: 'José Carlos' })
  user: string;

  @ApiProperty({ example: 'http://localhost:3003/avatar/user/2' })
  avatarUrl: string;

  @ApiProperty({ example: '2024-12-17T15:17:48.969Z' })
  data: string;
}

class TaskWithUser {
  @ApiProperty({ example: 3 })
  idTask: string;

  @ApiProperty({ example: '' })
  notes: string;

  @ApiProperty({ example: 'test' })
  name: string;

  @ApiProperty({ example: '1970-01-01T00:00:00.000Z' })
  data: string;

  @ApiProperty({ example: '15:00' })
  hourStart: string;

  @ApiProperty({ example: '21:00' })
  hourEnd: string;

  @ApiProperty({ example: false })
  completed: boolean;

  @ApiProperty({ example: '2024-12-17T15:16:05.755Z' })
  createdAt: string;

  @ApiProperty({ example: 'Maria Teixeira' })
  nameAssignee: string;

  @ApiProperty({ example: 'http://localhost:3003/avatar/user/2' })
  avatarAssignee: string;
}

export class DealDetailedOutput {
  @ApiProperty({ example: 6 })
  id: string;

  @ApiProperty({ example: 1 })
  storeId: string;

  @ApiPropertyOptional({ example: 1, nullable: true })
  customerId?: string;

  @ApiPropertyOptional({ example: 6, nullable: true })
  temporaryCustomerId?: string;

  @ApiProperty({ example: ORIGIN_DEAL.FACEBOOK })
  dealOrigin: string;

  @ApiProperty({ example: 'COLD' })
  temperature: string;

  @ApiPropertyOptional({ example: 'SELL', nullable: true })
  dealMode?: string;

  @ApiProperty({ example: STATUS_DEAL.DEAL_INITIAL })
  status: string;

  @ApiProperty({ example: 'Deal test 1' })
  title: string;

  @ApiProperty({ example: 'Teste aaa' })
  descriptionDeal: string;

  @ApiPropertyOptional({
    example: 'Esse is a note of test',
    nullable: true,
  })
  note?: string;

  @ApiProperty({ example: '2024-12-16T13:52:31.689Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-12-16T17:00:44.595Z' })
  updatedAt: string;

  @ApiPropertyOptional({ type: CustomerWithAvatar, nullable: true })
  customer?: CustomerWithAvatar;

  @ApiPropertyOptional({ type: TemporaryCustomer, nullable: true })
  temporaryCustomer?: TemporaryCustomer;

  @ApiProperty({ type: [AssigneeWithRoles] })
  assignees: AssigneeWithRoles[];

  @ApiProperty({ type: [CommentWithUser] })
  comments: CommentWithUser[];

  @ApiProperty({ type: [TaskWithUser] })
  tasks: TaskWithUser[];
}

export class GetDealByIdSuccess {
  @ApiProperty({ example: 'Operation completed successfully.' })
  message: string;

  @ApiProperty({ example: HttpStatus.OK })
  statusCode: number;

  @ApiProperty({ type: DealDetailedOutput })
  data: DealDetailedOutput;
}
