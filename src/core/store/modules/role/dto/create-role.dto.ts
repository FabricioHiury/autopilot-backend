import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsString,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  IsOptional,
  IsInt,
} from 'class-validator';
import { PERMISSIONS_STORE } from 'src/core/user/enum/permissions_features.enum';

@ValidatorConstraint({ name: 'isInEnum', async: false })
export class IsInEnum implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (Array.isArray(value)) {
      return value.every((val) =>
        Object.values(PERMISSIONS_STORE).includes(val),
      );
    }
    return false;
  }

  defaultMessage(args: ValidationArguments) {
    return `Os values accepted in array of permissions are: ${Object.values(PERMISSIONS_STORE).join(', ')}`;
  }
}

export class CreateRoleDto {
  @ApiProperty({ example: 1, description: 'Id of role' })
  @IsInt()
  @IsOptional()
  id?: string;

  @ApiProperty({ example: 'Manager', description: 'Name of role' })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiProperty({
    example: ['storeViewDeals', 'storeViewDashboard'],
    isArray: true,
    type: String,
    enum: PERMISSIONS_STORE,
  })
  @IsArray()
  @IsNotEmpty({ each: true })
  @IsString({ each: true })
  @Validate(IsInEnum)
  features: string[];
}
