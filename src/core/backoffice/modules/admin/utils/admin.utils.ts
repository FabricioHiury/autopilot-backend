import { PERMISSIONS_AUTOPILOT } from 'src/core/user/enum/permissions_features.enum';

export class IsInEnum {
  validate(value: any) {
    return Object.values(PERMISSIONS_AUTOPILOT).includes(value);
  }

  defaultMessage() {
    return `Os values accepted in array of permissions are: ${Object.values(PERMISSIONS_AUTOPILOT).join(', ')}`;
  }
}
