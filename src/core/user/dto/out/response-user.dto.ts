import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 'mail@mail.com' })
  email: string;

  @ApiProperty({ example: 'active' })
  status: string;

  @ApiProperty({ example: 'user' })
  profile: string;

  @ApiProperty({ example: 'Fulano of Tal' })
  name: string;

  @ApiProperty({ example: '2021-09-09T00:00:00.000Z' })
  dataCreation: Date;

  @ApiProperty({ example: '2021-09-09T00:00:00.000Z' })
  dataUpdate: Date;
}

export class ResponseDefaultUserDto {
  @ApiProperty({ example: 'Message of success.' })
  message: string;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: UserResponseDto })
  data: UserResponseDto;
}

export class ListOfUserDto {
  @ApiProperty({ example: 10 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 1 })
  totalPages: number;

  @ApiProperty({ example: 'São Paulo' })
  search: string;

  @ApiProperty({ example: 'all' })
  status: string;

  @ApiProperty({ type: [UserResponseDto] })
  users: UserResponseDto[];
}

export class ResponseListUserDto {
  @ApiProperty({ example: 'Operation completed successfully.' })
  readonly message: string;

  @ApiProperty({ example: 200 })
  readonly statusCode: number;

  @ApiProperty({ type: ListOfUserDto })
  readonly data: ListOfUserDto;
}
