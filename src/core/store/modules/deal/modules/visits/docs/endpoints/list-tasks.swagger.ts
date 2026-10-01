import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { CreateTaskOutputDto } from './create-task.swagger';

export class TaskOfListOutputDto extends CreateTaskOutputDto {}

export class ListTasksOutputDto {
  @ApiProperty({ type: [TaskOfListOutputDto] })
  customers: TaskOfListOutputDto[];
}

export class ListTasksSuccess {
  @ApiProperty({ example: 'Operation completed with success' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.OK] })
  statusCode: number;

  @ApiProperty()
  data: ListTasksOutputDto;
}

export class ListTasksNotFound {
  @ApiProperty({
    example: 'None deal with this ID was found',
  })
  message: string;

  @ApiProperty({ examples: [HttpStatus.NOT_FOUND] })
  statusCode: number;

  @ApiProperty()
  data: {};
}
