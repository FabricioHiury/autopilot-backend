import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class DeleteRoleDto {
  @ApiProperty({ example: 1, description: 'id of role' })
  @IsInt()
  @IsNotEmpty()
  id: string;
}
