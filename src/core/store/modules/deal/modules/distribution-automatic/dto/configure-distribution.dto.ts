import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ConfigureDistributionDto {
  @ApiProperty({
    description: 'Enable distribution automatic of deals',
    example: true,
  })
  @IsBoolean()
  distributionAutomatic: boolean;
}
