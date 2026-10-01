import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { Permissions } from './permissions.decorator';
import { USER_PROFILE } from 'src/core/user/enum/profile.enum';
import { USER_STATUS } from '../../../../utils/enum/user-status.enum';
import { AppErrorUnauthorized } from 'src/utils/errors/app-errors';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissions = this.reflector.get(Permissions, context.getHandler());
    if (!permissions) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const result = await this.checkPermissions(permissions, user.id);

    if (!result) {
      throw new AppErrorUnauthorized(
        'User not has permission for access this resource',
      );
    }

    return result;
  }

  private async checkPermissions(
    permissions: string[],
    id: string,
  ): Promise<boolean> {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: id,
      },
    });

    if (!user || user.status === USER_STATUS.INACTIVE) return false;

    const userPermissions = await this.prismaService.user.findUnique({
      where: {
        id: id,
      },
      select: {
        permission: {
          where: {
            status: USER_STATUS.ACTIVE,
          },
        },
      },
    });
    if (!userPermissions) return false;

    const permissionsOfUser = userPermissions.permission.map(
      (permission) => permission.feature,
    );

    return permissionsOfUser.some((permission) =>
      permissions.includes(permission),
    );
  }
}
