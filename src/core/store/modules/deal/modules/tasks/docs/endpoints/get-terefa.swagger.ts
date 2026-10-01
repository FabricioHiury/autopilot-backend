import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { CreateTaskOutputDto } from './create-task.swagger';

export class GetTaskOutputDto extends CreateTaskOutputDto {}

export class GetTaskSuccess {
  @ApiProperty({ example: 'Operation completed with success' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.OK] })
  statusCode: number;

  @ApiProperty()
  data: GetTaskOutputDto;
}

export class GetTaskNotFound {
  @ApiProperty({
    example: 'No task with this ID was found',
  })
  message: string;

  @ApiProperty({ examples: [HttpStatus.NOT_FOUND] })
  statusCode: number;

  @ApiProperty()
  data: {};
}
