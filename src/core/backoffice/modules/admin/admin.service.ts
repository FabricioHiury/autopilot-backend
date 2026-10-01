import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { CreateUserAdminDto } from './dto/create-user-admin.dto';
import { uuidv7 } from 'uuidv7';
import * as bcrypt from 'bcrypt';
import { USER_PROFILE } from 'src/core/user/enum/profile.enum';
import { MailService } from 'src/utils/mail/mail.service';
import {
  AppErrorConflict,
  AppErrorForbidden,
  AppErrorNotFound,
} from 'src/utils/errors/app-errors';
import { PermissionsAdminDto } from './dto/permissions-admin.dto';
import { EditUserAdminDto } from './dto/edit-user-admin.dto';
import { EditAdminLoggedInDto } from './dto/edit-admin-loggedIn.dto';
import { ListUsersAdminDto } from './dto/list-users-admin.dto';
import { Prisma } from '@prisma/client';
import { PERMISSIONS_AUTOPILOT } from 'src/core/user/enum/permissions_features.enum';
import { getStringUrlAvatar } from 'src/utils/avatarUtils';

@Injectable()
export class AdminService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly mailService: MailService,
  ) {}

  private readonly userSelect: Prisma.UserSelect = {
    id: true,
    email: true,
    name: true,
    status: true,
    profile: true,
    createdAt: true,
    permission: {
      select: {
        feature: true,
      },
    },
  };

  private async checkEmailUnique(email: string, userId?: string) {
    const emailExists = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });

    if (userId && emailExists && emailExists.id === userId) {
      return;
    }

    if (emailExists) {
      throw new AppErrorConflict('Email already registered.');
    }
  }

  async listPermissionsValid() {
    return Object.values(PERMISSIONS_AUTOPILOT);
  }

  async findAdminById(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
        profile: USER_PROFILE.AUTOPILOT,
        status: {
          not: 'deleted',
        },
      },
      select: this.userSelect,
    });

    if (!user) {
      throw new AppErrorNotFound('User admin not found.');
    }

    const permissions =
      user.permission?.map((permission) => permission.feature) ?? [];

    return {
      ...user,
      avatarUrl: getStringUrlAvatar(user.id),
      permission: undefined,
      permissions,
    };
  }

  async listUsersAdmin(params: ListUsersAdminDto) {
    const page = params.page ? +params.page : 1;
    const itemsByPage = params.itemsByPage ? +params.itemsByPage : 6;
    const search = params.search || '';
    let status = params.status ?? undefined;

    if (status === 'all') {
      status = undefined;
    }

    const dataInitial = params.dataInitial
      ? new Date(params.dataInitial)
      : undefined;

    const dataFinal = params.dataFinal ? new Date(params.dataFinal) : undefined;

    const where: Prisma.UserWhereInput = {
      AND: [
        {
          profile: USER_PROFILE.AUTOPILOT,
          status: {
            equals: status,
            not: 'deleted',
          },

          createdAt: {
            gte: dataInitial,
            lte: dataFinal,
          },
        },
        {
          OR: [
            {
              email: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        },
      ],
    };

    const users = await this.prismaService.user.findMany({
      where,
      skip: (page - 1) * itemsByPage,
      take: itemsByPage,
      select: this.userSelect,
    });

    const totalUsers = await this.prismaService.user.count({
      where,
    });

    const usersFormatted = users.map((user) => {
      const permissions =
        user.permission?.map((permission) => permission.feature) ?? [];

      return {
        ...user,
        avatarUrl: getStringUrlAvatar(user.id),
        permission: undefined,
        permissions,
      };
    });

    return {
      page,
      itemsByPage,
      totalPages: Math.ceil(totalUsers / itemsByPage),
      totalUsers,
      search,
      status: params.status,
      dataInitial,
      dataFinal,
      users: usersFormatted,
    };
  }

  async createUserAdmin(params: CreateUserAdminDto) {
    const hash = await bcrypt.hash(params.password, 10);

    await this.checkEmailUnique(params.email);

    const user = await this.prismaService.user.create({
      data: {
        email: params.email,
        password: hash,
        name: params.name,
        profile: USER_PROFILE.AUTOPILOT,
      },
      select: {
        id: true,
        email: true,
        name: true,
        profile: true,
      },
    });

    const permissionsUnique = Array.from(new Set(params.permissions));

    await this.prismaService.permission.createMany({
      data: permissionsUnique.map((permission) => ({
        userId: user.id,
        feature: permission,
      })),
    });

    await this.mailService.sendDataOfAccess({
      email: params.email,
      password: params.password,
      name: params.name,
      notes: params.notes,
    });

    const userUpdated = await this.findAdminById(user.id);

    return userUpdated;
  }

  async editUserAdmin(userId: string, params: EditUserAdminDto) {
    if (params.email) {
      await this.checkEmailUnique(params.email, userId);
    }

    const user = await this.findAdminById(userId);

    await this.prismaService.user.update({
      where: {
        id: userId,
      },
      data: {
        ...params,
      },
    });

    return {
      ...user,
      ...params,
    };
  }

  async editAdminLoggedIn(userId: string, params: EditAdminLoggedInDto) {
    if (params.email) {
      await this.checkEmailUnique(params.email, userId);
    }

    const paramsForUpdate = { ...params };

    if (params.password) {
      paramsForUpdate.password = await bcrypt.hash(params.password, 10);
    }

    await this.prismaService.user.update({
      where: {
        id: userId,
      },
      data: {
        ...paramsForUpdate,
      },
    });

    const userEdited = await this.findAdminById(userId);

    return userEdited;
  }

  async deleteUserAdmin(idUserLoggedIn: string, userId: string) {
    if (idUserLoggedIn === userId) {
      throw new AppErrorForbidden('You cannot can delete your own account.');
    }

    const user = await this.findAdminById(userId);

    const uniqueId = uuidv7();

    const emailUnique = `${user.email}+${uniqueId}`;

    const userDeleted = await this.prismaService.$transaction(
      async (prisma) => {
        await prisma.permission.deleteMany({
          where: {
            userId,
          },
        });

        return await prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            status: 'deleted',
            email: emailUnique,
          },
          select: this.userSelect,
        });
      },
    );

    return userDeleted;
  }

  async grantPermissions(
    idUserLoggedIn: string,
    userId: string,
    params: PermissionsAdminDto,
  ) {
    if (idUserLoggedIn === userId) {
      throw new AppErrorForbidden(
        'You cannot can update your own permissions.',
      );
    }

    const user = await this.findAdminById(userId);

    const newPermissions = params.permissions.filter(
      (permission) => !user.permissions?.includes(permission),
    );

    if (newPermissions.length === 0) {
      return {
        ...user,
        permissions: user.permissions ?? [],
        permission: undefined,
      };
    }

    await this.prismaService.permission.createMany({
      data: newPermissions.map((permission) => ({
        userId: user.id,
        feature: permission,
      })),
    });

    const userUpdated = await this.findAdminById(userId);

    return userUpdated;
  }

  async removePermissions(
    idUserLoggedIn: string,
    userId: string,
    params: PermissionsAdminDto,
  ) {
    if (idUserLoggedIn === userId) {
      throw new AppErrorForbidden(
        'You cannot can update your own permissions.',
      );
    }

    const user = await this.findAdminById(userId);

    const permissionsForRemove = params.permissions.filter((permission) =>
      user.permissions?.includes(permission),
    );

    if (permissionsForRemove.length === 0) {
      return {
        ...user,
        permissions: user.permissions ?? [],
        permission: undefined,
      };
    }

    await this.prismaService.permission.deleteMany({
      where: {
        userId,
        feature: {
          in: permissionsForRemove,
        },
      },
    });

    const userUpdated = await this.findAdminById(userId);

    return userUpdated;
  }
}
