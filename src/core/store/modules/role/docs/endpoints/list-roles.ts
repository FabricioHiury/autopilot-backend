import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

class RoleWithFeaturesArray {
  @ApiProperty({ example: 'Manager' })
  role: string;

  @ApiProperty({ example: ['storeViewDeals', 'storeViewDashboard'] })
  features: string[];
}

class ListRolesOutput {
  @ApiProperty({ type: [RoleWithFeaturesArray] })
  roles: RoleWithFeaturesArray[];
}

export class ListRolesSuccess {
  @ApiProperty({ example: 'Role created with success' })
  message: string;

  @ApiProperty({ example: HttpStatus.OK })
  status: number;

  @ApiProperty({ type: ListRolesOutput })
  data: ListRolesOutput;
}
