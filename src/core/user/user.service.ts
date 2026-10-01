import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { USER_PROFILE } from './enum/profile.enum';
import { CreateUserDto } from './dto/in/create-user.dto';
import { EditUserDto } from './dto/in/edit-user.dto';
import { ListUsersDto } from './dto/in/list-user.dto';
import { Prisma } from '@prisma/client';
import {
  AppErrorBadRequest,
  AppErrorConflict,
  AppErrorNotFound,
  AppErrorUnauthorized,
} from 'src/utils/errors/app-errors';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  private selectQuery: Prisma.UserSelect = {
    id: true,
    email: true,
    name: true,
    status: true,
    profile: true,
    createdAt: true,
    updatedAt: true,
  };

  private async getProfileAdmin(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
        profile: USER_PROFILE.STOREOWNER,
      },
    });

    if (!user) {
      throw new AppErrorUnauthorized('User not authorized.');
    }

    return user;
  }

  async listUsers(profile: string, params: ListUsersDto) {
    const page = params.page ? +params.page : 1;
    const limit = params.limit ? +params.limit : 10;
    const search = params.search ? params.search : '';
    const status = params.status ? params.status : 'all';

    const where: Prisma.UserWhereInput = {
      AND: [
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
        { profile },
        status === 'all' ? {} : { status },
      ],
    };

    const totalUsers = await this.prismaService.user.count({
      where: where,
    });

    const users = await this.prismaService.user.findMany({
      where: where,
      skip: (page - 1) * limit,
      take: limit,
      select: this.selectQuery,
      orderBy: {
        id: 'desc',
      },
    });

    return {
      total: totalUsers,
      page,
      totalPages: Math.ceil(totalUsers / limit),
      search,
      status,
      users: users,
    };
  }

  async updatePassword(userId: string, idUserEdit: string, password: string) {
    // Verificar perfil Admin
    const userAdmin = await this.getProfileAdmin(userId);

    if (!userAdmin || userId !== idUserEdit) {
      throw new AppErrorUnauthorized('User not authorized.');
    }

    // Alterar senha
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.prismaService.user.update({
      where: {
        id: idUserEdit,
      },
      data: {
        password: passwordHash,
      },
      select: this.selectQuery,
    });

    return user;
  }

  async createUser(createUserDto: CreateUserDto) {
    const hash = await bcrypt.hash(createUserDto.password, 10);

    return await this.prismaService.user.create({
      data: {
        email: createUserDto.email,
        password: hash,
        name: createUserDto.name,
        profile: createUserDto.profile,
      },
      select: this.selectQuery,
    });
  }

  async getUserById(idUserEdit: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: idUserEdit },
      select: this.selectQuery,
    });

    if (!user) {
      throw new AppErrorNotFound('User not found.');
    }

    return user;
  }

  async editUser(userId: string, idUserEdit: string, params: EditUserDto) {
    const userAdmin = await this.getProfileAdmin(userId);

    const user = await this.getUserById(idUserEdit);
    const status = userAdmin ? params.status : user.status;

    if (params.email) {
      const userEmail = await this.prismaService.user.findUnique({
        where: { email: params.email },
      });

      if (userEmail && userEmail.id !== idUserEdit) {
        throw new AppErrorConflict('Email already registered.');
      }
    }

    return await this.prismaService.user.update({
      where: { id: idUserEdit },
      data: {
        email: params.email,
        status: status,
        name: params.name,
      },
      select: this.selectQuery,
    });
  }

  async viewDataDashboard(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new AppErrorNotFound('User not found.');

    const dataDashboard = {
      name: user.name,
      email: user.email,
      profile: user.profile,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return dataDashboard;
  }
}
