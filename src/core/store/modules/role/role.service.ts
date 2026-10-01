import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import {
  AppErrorConflict,
  AppErrorNotFound,
} from 'src/utils/errors/app-errors';

@Injectable()
export class StoreRoleService {
  constructor(private readonly prismaService: PrismaService) {}

  async createRole(storeId: string, params: CreateRoleDto) {
    const features = params.features.join(',');

    const roleExists = await this.prismaService.role.findUnique({
      where: {
        storeId_role: {
          storeId,
          role: params.role,
        },
      },
    });

    if (roleExists && !params.id) {
      throw new AppErrorConflict('Role already registered');
    }

    if (roleExists && roleExists.id !== params.id) {
      throw new AppErrorConflict('Name of role already used');
    }

    return await this.prismaService.role.upsert({
      where: {
        id: params.id || '',
      },
      create: {
        storeId: storeId,
        role: params.role,
        features,
      },
      update: {
        role: params.role,
        features,
      },
    });
  }

  async listRoles(storeId: string) {
    const roles = await this.prismaService.role.findMany({
      where: {
        storeId,
      },
    });

    const rolesFormatted = roles.map((role) => {
      return {
        id: role.id,
        role: role.role,
        features: role.features.split(','),
      };
    });

    return { roles: rolesFormatted };
  }

  async deleteRole(storeId: string, idRole: string) {
    const roleExists = await this.prismaService.role.findUnique({
      where: {
        storeId,
        id: idRole,
      },
    });

    if (!roleExists) {
      throw new AppErrorNotFound('Role not found');
    }

    return await this.prismaService.role.delete({
      where: {
        id: idRole,
      },
    });
  }
}
