import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class SaveAvatarSuccess {
  @ApiProperty({ example: 'Operation completed with success' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.OK] })
  statusCode: number;

  @ApiProperty({
    example: 'http://linkavatar.com.br/avatar/user/1',
  })
  data: string;
}

export class SaveAvatarBadRequest {
  @ApiProperty({
    example:
      'Type of file invalid. Accepts one of these types: image/jpeg, image/jpg, image/webp, image/png',
  })
  message: string;

  @ApiProperty({ examples: [HttpStatus.BAD_REQUEST] })
  statusCode: number;

  @ApiProperty()
  data: {};
}
