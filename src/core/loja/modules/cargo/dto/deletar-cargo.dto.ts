import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class DeletarCargoDto {
  @ApiProperty({ example: 1, description: 'id do cargo' })
  @IsInt()
  @IsNotEmpty()
  id: string;
}
