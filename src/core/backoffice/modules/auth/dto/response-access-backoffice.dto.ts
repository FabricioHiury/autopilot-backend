import { ApiProperty } from '@nestjs/swagger';

export class ResponseAccessBackofficeDto {
  @ApiProperty({ description: 'ID of user' })
  id: string;

  @ApiProperty({ description: 'Name of user' })
  name: string;

  @ApiProperty({ description: 'Email of user' })
  email: string;

  @ApiProperty({ description: 'Profile of user' })
  profile: string;

  @ApiProperty({ description: 'Role of user', type: [String] })
  role: string[];

  @ApiProperty({ description: 'List of permissions of user', type: [String] })
  permission: string[];

  @ApiProperty({ description: 'Status of user' })
  status: string;

  @ApiProperty({ description: 'Data of query' })
  queryAt: Date;
}
