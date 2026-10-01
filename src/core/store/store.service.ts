import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { USER_PROFILE } from '../user/enum/profile.enum';
import {
  AppErrorBadRequest,
  AppErrorConflict,
  AppErrorInternal,
  AppErrorNotFound,
} from 'src/utils/errors/app-errors';
import {
  RegistrationAddressDto,
  RegistrationStoreOwnerDto,
  EditContactDto,
  EditStoreDto,
  ListStoreDto,
} from './dto/store.dto';
import { Prisma } from '@prisma/client';
import { STATUS_CUSTOMER } from './modules/customer/enum/customer.enum';
import { PERMISSIONS_STORE } from '../user/enum/permissions_features.enum';
import axios from 'axios';
import * as bcrypt from 'bcrypt';
import { MailService } from 'src/utils/mail/mail.service';
import { FileService } from 'src/persistence/files/file/file.service';

@Injectable()
export class StoreService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly emailService: MailService,
    private readonly fileService: FileService,
  ) {}

  private instanceAxios() {
    return axios.create({
      baseURL: process.env.API_BASE_URL.trim(),
      headers: {
        'x-micro-token': process.env.API_KEY,
      },
    });
  }

  async deleteAddress(storeId: string, idAddress: string) {
    const storeAddress = await this.getAddressById(idAddress);
    if (!storeAddress) {
      throw new AppErrorNotFound('Address with this ID not exists');
    }
    return await this.prismaService.storeAddress.delete({
      where: {
        id: idAddress,
        storeId: storeId,
      },
    });
  }

  async registerStoreOwner(dto: RegistrationStoreOwnerDto) {
    try {
      const hash = await bcrypt.hash(dto.password, 10);
      const confirmationToken =
        this.emailService.generateEmailConfirmationToken();
      const expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + 24);

      const name = dto.assignee ? dto.assignee : dto.name;

      const result = await this.prismaService.$transaction(
        async (prisma) => {
          const user = await prisma.user.create({
            data: {
              email: dto.email,
              password: hash,
              name: name,
              profile: USER_PROFILE.STOREOWNER,
              status: 'pending',
              emailConfirmed: false,
              tokenConfirmationEmail: confirmationToken,
              tokenExpiresAt: expirationDate,
            },
            select: {
              id: true,
              email: true,
              name: true,
              status: true,
              profile: true,
              createdAt: true,
              updatedAt: true,
            },
          });

          const storeOwner = await prisma.storeOwner.create({
            data: {
              userId: user.id,
              status: 'pending',
            },
            select: {
              id: true,
            },
          });

          const store = await prisma.store.create({
            data: {
              storeOwnerId: storeOwner.id,
              taxId: dto.taxId,
              companyName: dto.name,
            },
          });

          await prisma.storeAddress.create({
            data: {
              storeId: store.id,
              city: dto.city,
              state: dto.state,
              street: dto.street || '',
              district: dto.district || '',
              number: dto.number || null,
              complement: dto.complement || null,
              postalCode: dto.postalCode || null,
              branch: false,
            },
          });

          await prisma.storeContact.create({
            data: {
              storeId: store.id,
              name: dto.assignee || null,
              mobile: dto.phone || null,
              phone: dto.phone || null,
              email: dto.email,
            },
          });

          return {
            user,
            confirmationToken,
          };
        },
        {
          timeout: 120000,
        },
      );

      await this.emailService.sendEmailConfirmation(
        dto.name,
        dto.email,
        result.confirmationToken,
      );

      return {
        message:
          'Registration realizado with success! Verifique seu email for confirm a account.',
        email: dto.email,
      };
    } catch (error) {
      console.log(error);
      if (
        error instanceof AppErrorConflict ||
        error instanceof AppErrorNotFound
      ) {
        throw error;
      }

      if (error instanceof AppErrorInternal) {
        throw error;
      }

      throw new AppErrorInternal(
        'Failure in registration of storeOwner. By please, check the data and try again.',
      );
    }
  }

  async confirmEmail(token: string) {
    try {
      const userWithRelationships = await this.prismaService.user.findFirst({
        where: {
          tokenConfirmationEmail: token,
          tokenExpiresAt: { gte: new Date() },
        },
        include: {
          storeOwner: {
            include: {
              store: true,
            },
          },
        },
      });

      if (!userWithRelationships) {
        throw new AppErrorNotFound('Invalid token or expired.');
      }

      const storeOwner = userWithRelationships.storeOwner;
      const store = storeOwner?.store;
      if (!storeOwner || !store) {
        throw new AppErrorNotFound('Store not found for this user.');
      }

      const result = await this.prismaService.$transaction(
        async (prisma) => {
          const user = await prisma.user.findUnique({
            where: { id: userWithRelationships.id },
          });
          if (!user) {
            throw new AppErrorNotFound('User not found.');
          }

          if (user.status !== 'active' || !user.emailConfirmed) {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                status: 'active',
                emailConfirmed: true,
                tokenConfirmationEmail: null,
                tokenExpiresAt: null,
              },
            });
          } else {
            if (user.tokenConfirmationEmail || user.tokenExpiresAt) {
              await prisma.user.update({
                where: { id: user.id },
                data: {
                  tokenConfirmationEmail: null,
                  tokenExpiresAt: null,
                },
              });
            }
          }

          if (storeOwner.status === 'pending') {
            await prisma.storeOwner.update({
              where: { id: storeOwner.id },
              data: { status: 'active' },
            });
          }

          const features = Object.values(PERMISSIONS_STORE);
          await prisma.permission.createMany({
            data: features.map((feature: string) => ({
              userId: user.id,
              feature,
              status: 'active',
            })),
            skipDuplicates: true,
          });

          const featuresTemplate = [
            PERMISSIONS_STORE.STORE_REGISTER_EDIT_CUSTOMERS,
            PERMISSIONS_STORE.STORE_EDIT_DELETE_DEAL,
            PERMISSIONS_STORE.STORE_SEARCH_CUSTOMERS,
            PERMISSIONS_STORE.STORE_REPLY_CHAT,
            PERMISSIONS_STORE.STORE_VIEW_DEALS,
            PERMISSIONS_STORE.STORE_VIEW_DASHBOARD,
            PERMISSIONS_STORE.STORE_LINK_DEAL_USER,
            PERMISSIONS_STORE.STORE_VIEW_CHAT,
            PERMISSIONS_STORE.STORE_MANAGE_SUSPENSIONS,
            PERMISSIONS_STORE.STORE_VIEW_MESSAGES_TEMPLATE,
            PERMISSIONS_STORE.STORE_CREATE_MESSAGE_TEMPLATE,
            PERMISSIONS_STORE.STORE_EDIT_MESSAGE_TEMPLATE,
            PERMISSIONS_STORE.STORE_DELETE_MESSAGE_TEMPLATE,
          ];
          const rolesForCreate = [
            'Pre-salesperson',
            'Salesperson',
            'Manager',
            'Agent',
          ];

          for (const roleName of rolesForCreate) {
            const featuresRole =
              roleName === 'Pre-salesperson'
                ? [
                    ...featuresTemplate,
                    PERMISSIONS_STORE.STORE_PRE_SALESPERSON_FINALIZE_DEAL,
                  ]
                : featuresTemplate;
            await prisma.role.upsert({
              where: { storeId_role: { storeId: store.id, role: roleName } },
              update: {
                features: featuresRole.join(','),
              },
              create: {
                storeId: store.id,
                role: roleName,
                features: featuresRole.join(','),
              },
            });
          }

          const roles = await prisma.role.findMany({
            where: { storeId: store.id },
          });

          await prisma.employee.upsert({
            where: { userId: user.id },
            update: {
              storeId: store.id,
              name: user.name,
              taxId: store.taxId,
              status: 'active',
              roles: {
                set: [], // limpa vínculos anteriores
                connect: roles.map((c) => ({ id: c.id })),
              },
            },
            create: {
              storeId: store.id,
              userId: user.id,
              name: user.name,
              taxId: store.taxId,
              status: 'active',
              roles: {
                connect: roles.map((c) => ({ id: c.id })),
              },
            },
          });

          return {
            user,
            storeId: store.id,
            loginUrl: `${process.env.FRONTEND_URL}/login`,
          };
        },
        { timeout: 120000 },
      );

      try {
        const response = await this.instanceAxios().post(
          `/integrations/${result.storeId}`,
        );
        if (!response || response.status < 200 || response.status >= 300) {
          throw new Error(
            `Failure in integration external. Status: ${response?.status ?? 'unknown'}`,
          );
        }
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data ||
          err?.message ||
          '';

        if (
          typeof msg === 'string' &&
          msg.includes('This store has already been saved in the system.')
        ) {
        } else {
          console.error('Error in integration external:', err);
        }
      }

      try {
        await this.emailService.sendUserRegistrationEmail(
          userWithRelationships.name,
          userWithRelationships.email,
          result.loginUrl,
        );
      } catch (and) {
        console.error('Failure to send email of record:', and);
      }

      return {
        message: 'Email confirmed with success! Sua account was activated.',
        loginUrl: result.loginUrl,
      };
    } catch (error) {
      if (error instanceof AppErrorNotFound) {
        throw error;
      }
      throw new AppErrorInternal('Failed to confirm email.');
    }
  }

  async registerAddress(params: RegistrationAddressDto, storeId: string) {
    const paramsWithoutIdAddress = { ...params, idAddress: undefined };

    if (!params.idAddress) {
      return await this.prismaService.storeAddress.create({
        data: {
          storeId,
          ...paramsWithoutIdAddress,
        },
      });
    }

    const address = await this.prismaService.storeAddress.findUnique({
      where: {
        id: params.idAddress,
        storeId,
      },
    });

    if (!address) {
      throw new AppErrorNotFound('Address not found.');
    }

    return await this.prismaService.storeAddress.update({
      where: {
        id: params.idAddress,
        storeId,
      },
      data: {
        ...paramsWithoutIdAddress,
      },
    });
  }

  async registerContact(storeId: string, contactDto: EditContactDto) {
    const paramsWithoutIdContact = { ...contactDto, idContact: undefined };

    if (!contactDto.idContact) {
      return await this.prismaService.storeContact.create({
        data: {
          storeId: storeId,
          ...paramsWithoutIdContact,
        },
      });
    }

    const contact = await this.prismaService.storeContact.findUnique({
      where: {
        id: contactDto.idContact,
        storeId,
      },
    });

    if (!contact) {
      throw new AppErrorNotFound('Contact not found.');
    }

    return await this.prismaService.storeContact.update({
      where: {
        id: contactDto.idContact,
        storeId,
      },
      data: {
        ...paramsWithoutIdContact,
      },
    });
  }

  async getStoreById(id: string) {
    return await this.prismaService.store.findUnique({
      where: {
        id: id,
      },
      select: {
        photoUrl: true,
        storeAddress: true,
        storeOwner: {
          select: {
            user: {
              select: {
                email: true,
                name: true,
                createdAt: true,
              },
            },
          },
        },
        companyName: true,
        dealAssignee: true,
        activityPrimary: true,
        updatedAt: true,
        taxId: true,
        employee: true,
        storeContact: true,
        descriptionActivity: true,
        registrationState: true,
        registrationMunicipal: true,
        portalCompany: true,
        regimeTax: true,
      },
    });
  }

  async getAddressById(idAddress: string) {
    return await this.prismaService.storeAddress.findUnique({
      where: {
        id: idAddress,
      },
    });
  }

  async listStoreOwner(list: ListStoreDto) {
    const page = parseInt(list.page, 10) || 1;
    const limit = parseInt(list.limit, 10) || 20;
    const search = list.search ? list.search : '';
    const where: Prisma.StoreWhereInput = {
      companyName: {
        contains: search,
        mode: 'insensitive',
      },
    };

    const stores = await this.prismaService.store.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where: where,
      select: {
        id: true,
        companyName: true,
        taxId: true,
        storeAddress: true,
        storeContact: true,
        storeOwner: {
          select: {
            user: {
              select: {
                email: true,
                name: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });
    const totalStores = await this.prismaService.store.count({
      where: where,
    });
    return {
      stores: stores,
      page,
      limit,
      search,
      totalStores,
      totalPages: Math.ceil(totalStores / limit),
    };
  }

  async editStore(editStore: EditStoreDto, storeId: string) {
    if (editStore.taxId) {
      const taxIdExists = await this.prismaService.store.findUnique({
        where: {
          taxId: editStore.taxId,
        },
      });

      if (taxIdExists && taxIdExists.id !== storeId) {
        throw new AppErrorConflict('TAXID already registered');
      }
    }

    return await this.prismaService.store.update({
      where: { id: storeId },
      data: { ...editStore },
    });
  }

  async getStoreOwnerByIdUser(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: id },
      select: { storeOwner: true },
    });
    if (!user || !user.storeOwner) {
      throw new AppErrorNotFound('StoreOwner not found with this id of user');
    }
    return await this.prismaService.storeOwner.findUnique({
      where: {
        id: user.storeOwner.id,
      },
      select: {
        id: true,
        status: true,
        store: true,
      },
    });
  }

  async getStoreByIdUser(id: string) {
    const storeOwner = await this.prismaService.user.findUnique({
      where: { id: id },
      select: { storeOwner: true },
    });

    if (!storeOwner || !storeOwner.storeOwner) {
      throw new AppErrorNotFound('Store not found with this id of user');
    }

    const store = await this.prismaService.store.findUnique({
      where: { storeOwnerId: storeOwner.storeOwner.id },
      select: {
        id: true,
        storeContact: true,
        dealAssignee: true,
        activityPrimary: true,
        updatedAt: true,
        taxId: true,
        descriptionActivity: true,
        storeAddress: true,
        companyName: true,
        registrationState: true,
        registrationMunicipal: true,
        portalCompany: true,
        regimeTax: true,
      },
    });
    return store;
  }

  async getAccessByIdUser(userId: string, storeId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: {
        storeOwner: {
          include: {
            store: true,
          },
        },
        employee: {
          include: {
            store: true,
            roles: true,
          },
        },
        permission: {
          where: {
            status: 'active',
          },
        },
      },
    });

    if (!user) {
      throw new AppErrorNotFound('User not found');
    }

    if (user.profile === USER_PROFILE.STOREOWNER) {
      if (user.storeOwner.store.id !== storeId) {
        throw new AppErrorNotFound('User not found in store');
      }
    }

    if (user.profile === USER_PROFILE.USER) {
      if (user.employee.store.id !== storeId) {
        throw new AppErrorNotFound('User not found in store');
      }
    }

    if (user.profile === USER_PROFILE.STOREOWNER) {
      return {
        role: ['Administrador'],
        permission: Object.values(PERMISSIONS_STORE),
        queryAt: new Date().toISOString(),
      };
    }

    if (user.profile === USER_PROFILE.USER) {
      return {
        role: user.employee.roles.map((role) => role.role),
        permission: user.permission.map((permission) => permission.feature),
        queryAt: new Date().toISOString(),
      };
    }

    return null;
  }

  async updateLogo(storeId: string, file: Express.Multer.File) {
    if (!storeId) throw new AppErrorNotFound('Store not found');
    if (!file) throw new AppErrorNotFound('File not found');

    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/png',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new AppErrorBadRequest(
        `Type of file invalid. Accepts one of these types: ${allowedMimeTypes.join(', ')}`,
      );
    }

    const storeLogo = await this.fileService.saveFile({
      file: file,
      entity: 'logo',
      userId: storeId,
      entityId: storeId,
    });

    if (!storeLogo || !storeLogo.url)
      throw new AppErrorInternal('Failed to save o logo of store');

    await this.prismaService.store.update({
      where: { id: storeId },
      data: { photoUrl: storeLogo.url },
    });

    return {
      message: 'Logo of store updated with success',
      url: storeLogo.url,
    };
  }
}
