import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskOutputDto {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 1 })
  dealId: string;

  @ApiProperty({ example: 1 })
  @ApiProperty({ example: 'Notes' })
  notes: string;

  @ApiProperty({ example: 'Name of task' })
  name: string;

  @ApiProperty({ example: '2000-12-20T00:00:00.000Z' })
  data: string;

  @ApiProperty({ example: '11:00' })
  hourStart: string;

  @ApiProperty({ example: '10:00' })
  hourEnd: string;

  @ApiProperty({ example: false })
  completed: boolean;

  @ApiProperty({ example: '2000-12-20T00:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2000-12-20T00:00:00.000Z' })
  updatedAt: string;
}

export class CreateTaskSuccess {
  @ApiProperty({ example: 'Operation completed with success' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.OK] })
  statusCode: number;

  @ApiProperty()
  data: CreateTaskOutputDto;
}

export class CreateTaskNotFound {
  @ApiProperty({ example: 'No task with this ID was found' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.NOT_FOUND] })
  statusCode: number;

  @ApiProperty()
  data: {};
}
