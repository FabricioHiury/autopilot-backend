import { Injectable } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { Payload } from './entities/payload.entity';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { MailService } from 'src/utils/mail/mail.service';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  AppErrorInternal,
  AppErrorNotFound,
  AppErrorUnauthorized,
} from 'src/utils/errors/app-errors';
import { JwtService } from '@nestjs/jwt';
import { PROFILES_KEY } from './roles-decorators/profile/profile.decorator';
import { USER_PROFILE } from 'src/core/user/enum/profile.enum';
import { STATUS_CUSTOMER } from 'src/core/store/modules/customer/enum/customer.enum';
import { isUUID } from 'class-validator';
import { PERMISSIONS_AUTOPILOT } from 'src/core/user/enum/permissions_features.enum';
import { NovuService } from 'src/core/novu/novu.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly novuService: NovuService,
  ) {}

  private async validateANDGenerateToken(
    user: User,
    passwordForValidation: string,
    typeToken: 'access' | 'reset',
    storeId?: string,
  ): Promise<string> {
    const { password } = user;

    if (typeToken === 'access') {
      const passwordValid = await bcrypt.compare(
        passwordForValidation,
        password,
      );
      if (!passwordValid) throw new AppErrorUnauthorized('Invalid credentials');
    }
    // gerando payload
    const payload: Payload = {
      sub: user.id,
      ...(storeId ? { storeId } : {}),
    };

    let token: string;

    if (typeToken === 'reset') {
      payload.reset = true;
      token = this.jwtService.sign(payload, {
        expiresIn: '4h',
        secret: process.env.JWT_RESET_SECRET,
      });

      return token;
    }

    // gerando token
    token = this.jwtService.sign(payload, {
      //expiresIn: '30d',
      secret: process.env.JWT_SECRET,
    });

    return token;
  }

  async login(signAuthDto: LoginDto) {
    const { email, password, expoPushToken } = signAuthDto;

    try {
      const user = await this.prismaService.user.findUnique({
        where: { email },
        include: {
          storeOwner: { include: { store: true } },
          employee: {
            include: {
              store: {
                include: {
                  storeOwner: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        throw new AppErrorUnauthorized('Invalid credentials');
      }

      if (user.status !== STATUS_CUSTOMER.ACTIVE) {
        throw new AppErrorUnauthorized('User inactive, pending or blocked');
      }

      let storeId: string | null;
      let nameStore: string | null;

      if (user.profile === USER_PROFILE.STOREOWNER) {
        if (
          !user.storeOwner ||
          user.storeOwner.status !== STATUS_CUSTOMER.ACTIVE
        ) {
          throw new AppErrorUnauthorized('User inactive or blocked');
        }

        storeId = user.storeOwner.store.id;
        nameStore = user.storeOwner.store.companyName;
      }

      if (user.profile === USER_PROFILE.USER) {
        if (
          !user.employee ||
          user.employee.status !== STATUS_CUSTOMER.ACTIVE ||
          user.employee.store.storeOwner.status !== STATUS_CUSTOMER.ACTIVE
        ) {
          throw new AppErrorUnauthorized('User inactive or blocked');
        }

        storeId = user.employee.store.id;
        nameStore = user.employee.store.companyName;
      }

      const token = await this.validateANDGenerateToken(
        user,
        password,
        'access',
        storeId,
      );

      if (expoPushToken) {
        await this.prismaService.user.update({
          where: { id: user.id },
          data: { expoPushToken },
        });

        this.novuService
          .createOrUpdateSubscriber({
            subscriberId: user.id,
            email: user.email,
            firstName: user.name,
            expoPushToken,
          })
          .catch(() => {});
      }

      return {
        token,
        profile: user.profile,
        name: user.name || null,
        companyName: nameStore || null,
        storeId: storeId || null,
        id: user.id,
      };
    } catch (error) {
      throw error;
    }
  }

  async validateAuth(payload: Payload) {
    const { sub } = payload;

    if (typeof sub !== 'string' || !isUUID(sub)) {
      throw new AppErrorUnauthorized('Invalid token');
    }

    const user = await this.prismaService.user.findUnique({
      where: { id: sub },
      include: {
        storeOwner: { include: { store: true } },
        employee: { include: { store: true } },
      },
    });

    if (
      !user ||
      user.status !== 'active' ||
      payload.reset ||
      (user.employee && user.employee.status !== 'active') ||
      (user.storeOwner && user.storeOwner.status !== 'active')
    ) {
      return null;
    }

    const currentStoreId =
      user.storeOwner?.store?.id ?? user.employee?.store?.id ?? null;
    if (payload.storeId && payload.storeId !== currentStoreId) return null;
    return {
      id: user.id,
      storeId: user.storeOwner?.store?.id ?? user.employee?.store?.id ?? null,
      email: user.email,
      profile: user.profile,
    };
  }

  async sendEmailOfRecovery(email: string): Promise<void> {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new AppErrorNotFound('User not found');
      }

      const token = await this.validateANDGenerateToken(
        user,
        user.password,
        'reset',
      );

      const resetUrl = `${process.env.FRONTEND_URL}/authentication/reset-password?token=${token}`;

      await this.mailService.sendPasswordResetEmail(email, resetUrl, user.name);
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async validateResetToken(token: string): Promise<User> {
    const secret = process.env.JWT_RESET_SECRET;
    if (!secret) {
      throw new Error('Invalid token');
    }

    let payload: Payload;
    try {
      payload = this.jwtService.verify(token, { secret }) as Payload;
    } catch (and: any) {
      throw new AppErrorUnauthorized('Invalid token or expired');
    }

    if (!payload?.reset) {
      throw new AppErrorUnauthorized('Invalid token');
    }

    const { sub } = payload;

    if (typeof sub !== 'string' || !isUUID(sub)) {
      throw new AppErrorUnauthorized('Invalid token');
    }

    const user = await this.prismaService.user.findUnique({
      where: { id: sub },
    });

    if (!user) {
      throw new AppErrorNotFound('User not found');
    }

    return user as User;
  }

  async resetPassword(resetToken: string, newPassword: string) {
    const user = (await this.validateResetToken(resetToken)) as User;

    let hashedPassword: string;

    try {
      hashedPassword = await bcrypt.hash(newPassword, 10);
    } catch (err) {
      throw new AppErrorInternal('Failed to criptografar password');
    }

    await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    });

    return true;
  }

  async getAccessBackoffice(userId: string) {
    try {
      const user = await this.prismaService.user.findUnique({
        where: {
          id: userId,
          profile: USER_PROFILE.AUTOPILOT,
          status: {
            not: 'deleted',
          },
        },
        include: {
          permission: {
            where: {
              status: 'active',
            },
          },
        },
      });

      if (!user) {
        throw new AppErrorNotFound('User admin not found');
      }

      // Extract only as features of permissões
      const permissions =
        user.permission?.map((permission) => permission.feature) ?? [];

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        profile: user.profile,
        role: ['Admin'],
        permission: permissions,
        status: user.status,
        queryAt: new Date(),
      };
    } catch (error) {
      console.error('Failed to find permissions of user:', error);
      throw error;
    }
  }
}
