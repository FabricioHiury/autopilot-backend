import { ApiProperty } from '@nestjs/swagger';

class CreateFaqReply {
  @ApiProperty({ example: 71 })
  id: string;

  @ApiProperty({ example: 'You have problem in version 2' })
  title: string;

  @ApiProperty({ example: 'voce-has-problem-in-version-2-16' })
  slug: string;

  @ApiProperty({ example: 'contas' })
  category: string;

  @ApiProperty({
    example: `Buying a vehicle requires planning and research. This article covers the main steps.`,
  })
  content: string;

  @ApiProperty({
    example: 'Buying a vehicle requires planning and research.',
  })
  summary: string;

  @ApiProperty({ example: 'published' })
  status: string;

  @ApiProperty({ example: 0 })
  views: number;

  @ApiProperty({ example: '2024-12-05T12:48:59.495Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-12-05T12:48:59.495Z' })
  updatedAt: Date;

  @ApiProperty({
    type: [Object],
    example: [{ name: 'oil' }, { name: 'bread' }, { name: 'banana' }],
  })
  tags: { name: string }[];
}

export class CreateFaqSuccess {
  @ApiProperty({ example: 'Operation completed successfully.' })
  message: string;

  @ApiProperty({ example: 201 })
  statusCode: number;

  @ApiProperty({})
  data: CreateFaqReply;
}

export class CreateFaqBadRequest {
  @ApiProperty({
    example: 'Failed to create Faq',
  })
  message: string;

  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty()
  data: {};
}
