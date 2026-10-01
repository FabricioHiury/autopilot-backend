import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { PERMISSIONS_ALL } from 'src/core/user/enum/permissions_features.enum';
import { AppErrorUnauthorized } from 'src/utils/errors/app-errors';

@Injectable()
export class ProfileGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const profiles = this.reflector.get<string[]>(
      'profiles',
      context.getHandler(),
    );
    if (!profiles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const validated = profiles.includes(user.profile);

    if (!validated)
      throw new AppErrorUnauthorized(
        'User not has permission for access this resource',
      );

    return validated;
  }
}
