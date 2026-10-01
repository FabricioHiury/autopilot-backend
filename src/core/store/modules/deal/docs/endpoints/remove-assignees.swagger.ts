import { ApiProperty } from '@nestjs/swagger';

export class RemoveAssigneesSuccess {
  @ApiProperty({ example: 'Operation completed with success' })
  message: string;

  @ApiProperty({ example: 200 })
  statusCode: number;
}

export class RemoveAssigneesError {
  @ApiProperty({
    example: 'None of assignees provided is linked to deal',
  })
  message: string;

  @ApiProperty({ example: 400 })
  statusCode: number;
}
