import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { CreateTaskOutputDto } from './create-task.swagger';

export class UpdateStatusTaskOutputDto extends CreateTaskOutputDto {}

export class UpdateStatusTaskSuccess {
  @ApiProperty({ example: 'Operation completed with success' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.OK] })
  statusCode: number;

  @ApiProperty()
  data: UpdateStatusTaskOutputDto;
}

export class UpdateStatusTaskNotFound {
  @ApiProperty({
    example: 'No task with this ID was found',
  })
  message: string;

  @ApiProperty({ examples: [HttpStatus.NOT_FOUND] })
  statusCode: number;

  @ApiProperty()
  data: {};
}

export class UpdateStatusTaskConflict {
  @ApiProperty({
    example: 'A task with this id already was completed',
  })
  message: string;

  @ApiProperty({ examples: [HttpStatus.CONFLICT] })
  statusCode: number;

  @ApiProperty()
  data: {};
}
