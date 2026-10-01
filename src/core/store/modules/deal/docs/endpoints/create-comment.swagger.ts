import { ApiProperty } from '@nestjs/swagger';

export class CommentOutput {
  @ApiProperty({ example: 3 })
  id: string;

  @ApiProperty({ example: 1 })
  dealId: string;

  @ApiProperty({ example: 1 })
  userId: string;

  @ApiProperty({ example: 'Comment of test' })
  comment: string;

  @ApiProperty({ example: '2024-12-16T22:39:59.099Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-12-16T22:39:59.099Z' })
  updatedAt: Date;
}

export class CreateCommentDealSuccess {
  @ApiProperty({ example: 'Operation completed successfully.' })
  message: string;

  @ApiProperty({ example: 201 })
  statusCode: number;

  @ApiProperty({ type: CommentOutput })
  data: CommentOutput;
}
