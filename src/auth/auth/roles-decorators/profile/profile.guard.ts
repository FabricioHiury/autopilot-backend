import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { AppErrorForbidden, AppErrorUnauthorized } from 'src/utils/errors/app-errors';
import { PROFILES_KEY } from './profile.decorator';

@Injectable()
export class ProfileGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const profiles = this.reflector.getAllAndOverride<string[]>(PROFILES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!profiles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) throw new AppErrorUnauthorized('Authentication required');

    const validated = profiles.includes(user.profile);

    if (!validated)
      throw new AppErrorForbidden(
        'User not has permission for access this resource',
      );

    return validated;
  }
}
