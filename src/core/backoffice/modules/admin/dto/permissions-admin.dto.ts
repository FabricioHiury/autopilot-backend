import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, Validate } from 'class-validator';
import { PERMISSIONS_AUTOPILOT } from 'src/core/user/enum/permissions_features.enum';
import { IsInEnum } from '../utils/admin.utils';

export class PermissionsAdminDto {
  @ApiProperty({
    example: ['autopilotViewSubscribers', 'autopilotViewDashboard'],
    isArray: true,
    type: String,
    enum: PERMISSIONS_AUTOPILOT,
  })
  @IsArray()
  @IsNotEmpty({ each: true })
  @IsString({ each: true })
  @Validate(IsInEnum, { each: true })
  permissions: string[];
}
