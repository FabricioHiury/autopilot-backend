import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { GetTaskOutputDto } from './get-terefa.swagger';

export class EditTaskOutputDto extends GetTaskOutputDto {}

export class EditTaskSuccess {
  @ApiProperty({ example: 'Operation completed with success' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.OK] })
  statusCode: number;

  @ApiProperty()
  data: EditTaskOutputDto;
}

export class EditTaskNotFound {
  @ApiProperty({ example: 'No task with this ID was found' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.NOT_FOUND] })
  statusCode: number;

  @ApiProperty()
  data: {};
}
