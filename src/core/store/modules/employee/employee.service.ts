import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import {
  AppErrorBadRequest,
  AppErrorInternal,
  AppErrorNotFound,
} from 'src/utils/errors/app-errors';
import {
  CreateEmployeeDto,
  EditEmployeeDto,
  EditStatusEmployeeDto,
} from './dto/employee.dto';
import * as bcrypt from 'bcrypt';
import { USER_STATUS } from 'src/utils/enum/user-status.enum';
import { ListEmployeesDto } from './dto/list-employees.dto';
import { Store, Prisma } from '@prisma/client';
import { USER_PROFILE } from 'src/core/user/enum/profile.enum';

@Injectable()
export class EmployeeService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeEmail(email?: string) {
    return email?.trim().toLowerCase();
  }

  private async assertStoreExists(storeId: string): Promise<Pick<Store, 'id'>> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true },
    });
    if (!store) throw new AppErrorNotFound('Store not found.');
    return store;
  }

  private async ensureEmailAvailable(email: string, excludeUserId?: string) {
    const exists = await this.prisma.user.findFirst({
      where: {
        email,
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      },
      select: { id: true },
    });
    if (exists) {
      throw new AppErrorBadRequest(
        'There is already a user registered with this email',
      );
    }
  }

  private async assertRolesValid(roles: string[]) {
    if (!roles?.length) {
      throw new AppErrorBadRequest(
        'It is necessary to provide the roles of employee.',
      );
    }
    const count = await this.prisma.role.count({
      where: { id: { in: roles } },
    });
    if (count !== roles.length) {
      throw new AppErrorBadRequest('One or more roles provided are invalid.');
    }
  }

  async createEmployee(storeId: string, dto: CreateEmployeeDto) {
    if (!storeId || !dto) throw new AppErrorBadRequest('Parameters invalid');

    const store = await this.assertStoreExists(storeId);

    const email = this.normalizeEmail(dto.email)!;
    await this.ensureEmailAvailable(email);
    await this.assertRolesValid(dto.roles ?? []);

    const result = await this.prisma.$transaction(async (tx) => {
      const passwordWithHash = await bcrypt.hash(dto.password, 10);

      const user = await tx.user.create({
        data: {
          email,
          password: passwordWithHash,
          name: dto.name,
          profile: USER_PROFILE.USER,
          status: USER_STATUS.ACTIVE,
        },
        select: { id: true, name: true, email: true },
      });

      const employee = await tx.employee.create({
        data: {
          storeId: store.id,
          userId: user.id,
          name: dto.name,
          taxId: dto.taxId,
          whatsapp: dto.whatsapp,
          phoneAdditional: dto.phoneAdditional,
          status: USER_STATUS.ACTIVE,
          notes: dto.notes,
          roles: { connect: (dto.roles ?? []).map((id) => ({ id })) },
        },
        select: {
          storeId: true,
          userId: true,
          taxId: true,
          whatsapp: true,
          phoneAdditional: true,
          notes: true,
          status: true,
          createdAt: true,
        },
      });

      if (dto.features?.length) {
        await tx.permission.createMany({
          data: dto.features.map((func) => ({
            userId: user.id,
            feature: func,
            status: USER_STATUS.ACTIVE,
          })),
          skipDuplicates: true,
        });
      }

      return {
        storeId: employee.storeId,
        userId: employee.userId,
        name: user.name,
        email: user.email,
        taxId: employee.taxId,
        whatsapp: employee.whatsapp,
        phoneAdditional: employee.phoneAdditional,
        notes: employee.notes,
        status: employee.status,
        createdAt: employee.createdAt,
        permissions: dto.features ?? [],
      };
    });

    if (!result) throw new AppErrorInternal('Failed to create employee');
    return result;
  }

  async updateEmployee(
    employeeId: string,
    storeId: string,
    dto: EditEmployeeDto,
  ) {
    if (!employeeId || !storeId || !dto)
      throw new AppErrorBadRequest('Parameters invalid');

    const store = await this.assertStoreExists(storeId);

    const existing = await this.prisma.employee.findUnique({
      where: { id: employeeId, storeId: store.id, status: USER_STATUS.ACTIVE },
      select: {
        id: true,
        userId: true,
        storeId: true,
        user: { select: { email: true } },
      },
    });

    if (!existing) throw new AppErrorNotFound('Employee not found.');

    const { email, password, features, roles, ...employeeData } = dto;

    if (roles) await this.assertRolesValid(roles);

    const newEmail = this.normalizeEmail(email);
    if (newEmail && newEmail !== existing.user.email) {
      await this.ensureEmailAvailable(newEmail, existing.userId);
    }

    const passwordWithHash = password
      ? await bcrypt.hash(password, 10)
      : undefined;

    await this.prisma.$transaction(async (tx) => {
      // Permissões
      await tx.permission.deleteMany({ where: { userId: existing.userId } });
      if (features?.length) {
        await tx.permission.createMany({
          data: features.map((f) => ({
            userId: existing.userId,
            feature: f,
            status: USER_STATUS.ACTIVE,
          })),
          skipDuplicates: true,
        });
      }

      // Colaborador + Usuário
      await tx.employee.update({
        where: { id: employeeId, storeId: store.id },
        data: {
          ...employeeData,
          ...(roles ? { roles: { set: roles.map((id) => ({ id })) } } : {}),
          user: {
            update: {
              ...(newEmail ? { email: newEmail } : {}),
              ...(passwordWithHash ? { password: passwordWithHash } : {}),
            },
          },
        },
      });
    });

    // Retorna entidade atualizada
    const updated = await this.prisma.employee.findUnique({
      where: { id: employeeId, storeId: store.id },
      include: {
        user: {
          select: {
            email: true,
          },
        },
        roles: true,
      },
    });

    if (!updated) throw new AppErrorInternal('Failed to update employee.');
    return updated;
  }

  async getAllEmployees(storeId: string, params: ListEmployeesDto) {
    const page = params.page ? +params.page : 1;
    const limit = params.limit ? +params.limit : 10;
    const search = params.search?.trim() ?? '';
    const roleFilter = params.role?.trim() ?? '';

    const whereBase: Prisma.EmployeeWhereInput = {
      storeId: storeId,
      status: USER_STATUS.ACTIVE,
      ...(roleFilter
        ? {
            roles: {
              some: { role: { contains: roleFilter, mode: 'insensitive' } },
            },
          }
        : {}),
    };

    const whereSearch: Prisma.EmployeeWhereInput = search
      ? {
          ...whereBase,
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            {
              user: {
                email: { contains: search, mode: 'insensitive' },
              },
            },
          ],
        }
      : whereBase;

    const [employees, totalEmployees] = await this.prisma.$transaction([
      this.prisma.employee.findMany({
        where: whereSearch,
        include: {
          user: {
            include: {
              permission: { select: { feature: true } },
            },
          },
          roles: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.employee.count({ where: whereSearch }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalEmployees / limit));

    const employeesFormatted = employees.map((c) => ({
      id: c.id,
      storeId: c.storeId,
      roles: c.roles,
      userId: c.userId,
      name: c.name,
      avatar: c.user.photoUrl || c.photoUrl || null,
      taxId: c.taxId,
      whatsapp: c.whatsapp,
      phoneAdditional: c.phoneAdditional,
      status: c.status,
      notes: c.notes,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      email: c.user.email,
    }));

    return {
      search,
      page,
      limit,
      totalPages,
      totalEmployees,
      employees: employeesFormatted,
    };
  }

  async getEmployee(employeeId: string, storeId: string) {
    if (!employeeId || !storeId)
      throw new AppErrorBadRequest('Parameters invalid');

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId, storeId: storeId, status: USER_STATUS.ACTIVE },
      select: {
        user: {
          select: {
            email: true,
            name: true,
            permission: { select: { feature: true } },
          },
        },
        createdAt: true,
        taxId: true,
        name: true,
        whatsapp: true,
        phoneAdditional: true,
        dealTask: true,
        status: true,
        id: true,
        roles: true,
        userId: true,
        dealAssignee: true,
        notes: true,
      },
    });

    if (!employee) throw new AppErrorNotFound('Employee not found.');

    const { user, ...rest } = employee;
    const permissions = user.permission.map((p) => p.feature);

    return {
      ...rest,
      email: user.email,
      features: permissions,
    };
  }

  async updateEmployeeStatus(
    employeeId: string,
    storeId: string,
    dto: EditStatusEmployeeDto,
  ) {
    if (!employeeId || !storeId || !dto)
      throw new AppErrorBadRequest('Parameters invalid');

    const store = await this.assertStoreExists(storeId);

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId, storeId: store.id },
      select: { id: true, userId: true },
    });
    if (!employee) throw new AppErrorNotFound('Employee not found.');

    const updated = await this.prisma.employee.update({
      where: { id: employeeId, storeId: store.id },
      data: { status: dto.status },
      select: { id: true, userId: true, status: true },
    });

    if (!updated)
      throw new AppErrorInternal('Failed to update status of employee.');

    if (updated.status === USER_STATUS.INACTIVE) {
      await this.prisma.$transaction(async (tx) => {
        await tx.permission.deleteMany({ where: { userId: updated.userId } });
        await tx.user.update({
          where: { id: updated.userId },
          data: {
            status: USER_STATUS.INACTIVE,
            email: `${Math.random().toString(36).slice(2)}@removi.of`,
          },
        });
      });
    }

    return updated;
  }
}
