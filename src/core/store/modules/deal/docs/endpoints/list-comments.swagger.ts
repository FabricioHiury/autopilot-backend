import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

class UserComment {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: null, nullable: true })
  name: string;

  @ApiProperty({ example: null, nullable: true })
  idPhoto: string;
}

class CommentOutput {
  @ApiProperty({ example: 3 })
  id: string;

  @ApiProperty({ example: 'Comment of test' })
  comment: string;

  @ApiProperty({ example: '2024-12-16T22:39:59.099Z' })
  createdAt: Date;

  @ApiProperty({ type: () => UserComment })
  user: UserComment;
}

class ListCommentsOutput {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  itemsPage: number;

  @ApiProperty({ type: () => [CommentOutput] })
  comments: CommentOutput[];
}

export class ListCommentsSuccess {
  @ApiProperty({ example: 'Operation completed successfully.' })
  message: string;

  @ApiProperty({ example: HttpStatus.OK })
  statusCode: number;

  @ApiProperty({ type: () => ListCommentsOutput })
  data: ListCommentsOutput;
}

export class ListCommentsNotFound {
  @ApiProperty({ example: 'Deal not found.' })
  message: string;

  @ApiProperty({ example: HttpStatus.NOT_FOUND })
  statusCode: number;
}
