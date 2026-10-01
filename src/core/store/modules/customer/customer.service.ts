import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import {
  CreateCustomerDto,
  EditCustomerDto,
  ListCustomerDto,
} from './dto/customer.dto';
import {
  AppErrorConflict,
  AppErrorNotFound,
} from 'src/utils/errors/app-errors';
import { Prisma } from '@prisma/client';
import { STATUS_CUSTOMER } from './enum/customer.enum';
import { FileService } from 'src/persistence/files/file/file.service';
import * as XLSX from 'xlsx';

@Injectable()
export class CustomerService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly fileService: FileService,
  ) {}

  private async validateStore(storeId: string) {
    const store = await this.prismaService.store.findUnique({
      where: {
        id: storeId,
      },
    });

    if (!store) {
      throw new AppErrorNotFound(
        'Failed to find a store with the ID provided.',
      );
    }
  }

  async createCustomerInStore(
    storeId: string,
    userId: string,
    createCustomer: CreateCustomerDto,
  ) {
    await this.validateStore(storeId);

    const customerByDocument = await this.prismaService.customer.findFirst({
      where: {
        taxId: createCustomer.taxId,
        storeId,
      },
    });

    if (customerByDocument) {
      throw new AppErrorConflict(
        'There is already a customer registered with this CPF or TAXID this store.',
      );
    }

    if (createCustomer.email) {
      const customerByEmail = await this.prismaService.customer.findFirst({
        where: {
          email: createCustomer.email,
          storeId,
        },
      });

      if (customerByEmail) {
        throw new AppErrorConflict(
          'There is already a customer registered with this EMAIL this store.',
        );
      }
    }
    await this.prismaService.$transaction(async (prisma) => {
      // Criando cliente
      const customer = await prisma.customer.create({
        data: {
          storeId: storeId,
          name: createCustomer.name,
          typePerson: createCustomer.typePerson,
          taxId: createCustomer.taxId,
          identityNumber: createCustomer.identityNumber,
          foreigner: createCustomer.foreigner,
          gender: createCustomer.gender,
          birthDate: createCustomer.birthDate,
          phone: createCustomer.phone,
          whatsapp: createCustomer.whatsapp,
          email: createCustomer.email,
          version: 1,
          notes: createCustomer.notes,
        },
      });

      // Criando endereço com o ID do cliente
      await prisma.customerAddress.create({
        data: {
          customerId: customer.id,
          postalCode: createCustomer.postalCode,
          state: createCustomer.state,
          city: createCustomer.city,
          address: createCustomer.address,
          district: createCustomer.district,
          number: createCustomer.number,
          complement: createCustomer.complement,
        },
      });
    });

    const customer = await this.prismaService.customer.findFirst({
      where: {
        taxId: createCustomer.taxId,
      },
      include: {
        customerAddress: true,
      },
    });

    const totalDeals = await this.prismaService.deal.count({
      where: {
        customerId: customer.id,
      },
    });

    // Criando o primeiro historico de alteração
    await this.prismaService.customerRegistrationHistory.create({
      data: {
        customerId: customer.id,
        idUserEditor: userId,
        version: 1,
        update: JSON.stringify(customer),
      },
    });

    return {
      ...customer,
      totalDeals,
    };
  }

  async sendAttachment(
    storeId: string,
    customerId: string,
    files: Express.Multer.File[],
  ) {
    this.validateStore(storeId);

    const documentMimeTypes = [
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/pdf', // .pdf
      'text/plain', // .txt
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-powerpoint', // .ppt
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'application/rtf', // .rtf
      'text/html', // .html
      'text/csv', // .csv
      'application/epub+zip', // .epub
      'application/x-iwork-pages-sffpages', // .pages (Apple iWork)
      'application/vnd.oasis.opendocument.text', // .odt
      'application/vnd.oasis.opendocument.spreadsheet', // .ods
      'application/vnd.oasis.opendocument.presentation', // .odp
      'application/vnd.oasis.opendocument.graphics', // .odg
      'application/vnd.google-apps.document', // Google Docs
      'application/vnd.google-apps.spreadsheet', // Google Sheets
      'application/vnd.google-apps.presentation', // Google Slides
    ];

    const fileCreated = await this.fileService.saveFileUUID({
      file: files[0],
      allowedMimeTypes: documentMimeTypes,
    });

    const customerAttachment = this.prismaService.customerAttachment.create({
      data: {
        fileId: fileCreated.id,
        customerId: customerId,
      },
      select: {
        fileId: true,
        id: true,
        file: {
          select: {
            url: true,
            name: true,
            createdAt: true,
            type: true,
          },
        },
      },
    });

    return customerAttachment;
  }

  async findCustomerById(storeId: string, customerId: string) {
    this.validateStore(storeId);

    const customer = await this.prismaService.customer.findUnique({
      where: {
        id: customerId,
        storeId,
      },
      include: {
        customerAddress: true,

        historyDataRegistration: {
          where: {
            version: 1,
          },
          select: {
            createdAt: true,
            idUserEditor: true,
          },
        },
        deal: {
          select: {
            dealVisit: {
              select: {
                notes: true,
                hourEnd: true,
                hourStart: true,
                completed: true,
                data: true,
                type: true,
                createdAt: true,
                id: true,
              },
            },
            dealTask: {
              select: {
                notes: true,
                name: true,
                createdAt: true,
                hourEnd: true,
                hourStart: true,
                employee: {
                  select: {
                    name: true,
                    userId: true,
                  },
                },
                completed: true,
              },
            },
            createdAt: true,
            descriptionDeal: true,
            id: true,
            attachments: {
              select: {
                createdAt: true,
                file: {
                  select: {
                    url: true,
                    name: true,
                    type: true,
                  },
                },
              },
            },
            note: true,
            status: true,
            title: true,
            temperature: true,
            dealOrigin: true,
            dealMode: true,
            dealActivityLogs: {
              select: {
                message: true,
                id: true,
                createdAt: true,
              },
            },
            dealComment: true,
            dealAssignee: {
              select: {
                employee: {
                  select: {
                    name: true,
                    userId: true,
                  },
                },
              },
            },
            chat: {
              select: {
                _count: true,
              },
            },
          },
        },
      },
    });

    const userEditor = customer.historyDataRegistration
      ? customer.historyDataRegistration[0]
      : null;

    let userCreator = null;
    if (userEditor) {
      userCreator = await this.prismaService.user.findUnique({
        where: {
          id: userEditor.idUserEditor,
        },
        select: {
          name: true,
          profile: true,
          id: true,
        },
      });
    }

    const totalDeals = await this.prismaService.deal.count({
      where: {
        customerId,
      },
    });

    const attachments = await this.prismaService.customerAttachment.findMany({
      where: {
        customerId: customerId,
      },
      select: {
        file: {
          select: {
            url: true,
            name: true,
            type: true,
            createdAt: true,
            id: true,
          },
        },
      },
    });

    if (!customer) {
      throw new AppErrorNotFound(
        'None customer with this ID was found this store.',
      );
    }

    return {
      ...customer,
      deals: customer.deal,
      deal: undefined,
      attachments: attachments,
      totalDeals,
      userCreator: userCreator ? userCreator : null,
    };
  }

  async findCustomersByStore(storeId: string, params: ListCustomerDto) {
    this.validateStore(storeId);

    const page = params.page ? +params.page : 1;
    const limit = params.limit ? +params.limit : 10;
    const search = params.search ? params.search : '';
    const gender = params.gender;
    const state = params.state;
    const channelOrigin = params.channelOrigin;

    let dataInitial = params.dataInitial
      ? new Date(params.dataInitial)
      : undefined;
    let dataFinal = params.dataFinal ? new Date(params.dataFinal) : undefined;

    if (dataInitial) {
      dataInitial = new Date(dataInitial.setUTCHours(0, 0, 0, 0));
    }

    if (dataFinal) {
      dataFinal = new Date(dataFinal.setUTCHours(23, 59, 59, 999));
    }

    let whereData: Prisma.CustomerWhereInput;

    if (dataInitial && dataFinal) {
      if (dataInitial) {
        dataInitial = new Date(dataInitial.setUTCHours(0, 0, 0, 0));
      }

      if (dataFinal) {
        dataFinal = new Date(dataFinal.setUTCHours(23, 59, 59, 999));
      }

      whereData = {
        createdAt: {
          gte: dataInitial,
          lte: dataFinal,
        },
      };
    } else {
      dataInitial = undefined;
      dataFinal = undefined;
    }

    let whereSearch: Prisma.CustomerWhereInput;

    if (search) {
      const fieldsSearches = [
        'name',
        'email',
        'phone',
        'whatsapp',
        'taxId',
        'identityNumber',
      ];

      whereSearch = {
        OR: fieldsSearches.map((field) => ({
          [field]: {
            contains: search,
            mode: 'insensitive',
          },
        })),
      };
    }

    let whereGender: Prisma.CustomerWhereInput;
    if (gender) {
      whereGender = {
        gender: gender,
      };
    }

    let whereState: Prisma.CustomerWhereInput;
    if (state) {
      whereState = {
        customerAddress: {
          state: {
            equals: state,
            mode: 'insensitive',
          },
        },
      };
    }

    let whereChannelOrigin: Prisma.CustomerWhereInput;
    if (channelOrigin) {
      whereChannelOrigin = {
        chat: {
          some: {
            channel: {
              equals: channelOrigin,
              mode: 'insensitive',
            },
          },
        },
      };
    }

    const whereFormatted: Prisma.CustomerWhereInput = {
      ...whereData,
      ...whereSearch,
      ...whereGender,
      ...whereState,
      ...whereChannelOrigin,
      storeId,
      status: {
        not: 'inactive',
      },
    };

    const customers = await this.prismaService.customer.findMany({
      where: whereFormatted,
      include: {
        customerAddress: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { id: 'desc' },
    });

    const totalCustomers = await this.prismaService.customer.count({
      where: whereFormatted,
    });

    const totalPages = Math.ceil(totalCustomers / limit);

    const getTotalDeals = async (customerId: string) => {
      return this.prismaService.deal.count({
        where: {
          customerId,
        },
      });
    };

    const customersFormatted = await Promise.all(
      customers.map(async (customer) => {
        return {
          ...customer,
          totalDeals: await getTotalDeals(customer.id),
        };
      }),
    );

    const registrationsRecent = await this.prismaService.customer.count({
      where: {
        storeId: storeId,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      search,
      page,
      limit,
      totalCustomers,
      totalPages,
      dataInitial,
      dataFinal,
      gender,
      state,
      channelOrigin,
      customers: customersFormatted,
      registrationsRecent,
    };
  }

  async editCustomerInStore(
    storeId: string,
    userId: string,
    customerId: string,
    editCustomer: EditCustomerDto,
  ) {
    await this.validateStore(storeId);

    const customer = await this.prismaService.customer.findUnique({
      where: {
        id: customerId,
        storeId: storeId,
      },
    });

    if (!customer) {
      throw new AppErrorNotFound('None customer with this ID was found.');
    }

    if (editCustomer.email) {
      const searchCustomerEmail = await this.prismaService.customer.findFirst({
        where: {
          storeId,
          email: editCustomer.email,
          NOT: {
            id: customerId,
          },
        },
      });

      if (searchCustomerEmail) {
        throw new AppErrorConflict(
          'There is already a customer with this address of email registered.',
        );
      }
    }

    if (editCustomer.taxId) {
      const searchCustomerDocumentTax =
        await this.prismaService.customer.findFirst({
          where: {
            storeId,
            taxId: editCustomer.taxId,
            NOT: {
              id: customerId,
            },
          },
        });

      if (searchCustomerDocumentTax) {
        throw new AppErrorConflict(
          'There is already a customer with this document tax registered.',
        );
      }
    }

    await this.prismaService.$transaction(async (prisma) => {
      const customerUpdated = await prisma.customer.update({
        where: {
          id: customerId,
        },
        data: {
          name: editCustomer.name,
          typePerson: editCustomer.typePerson,
          taxId: editCustomer.taxId,
          identityNumber: editCustomer.identityNumber,
          foreigner: editCustomer.foreigner,
          gender: editCustomer.gender,
          birthDate: editCustomer.birthDate,
          phone: editCustomer.phone,
          whatsapp: editCustomer.whatsapp,
          email: editCustomer.email,
          notes: editCustomer.notes,
          version: customer.version + 1,
        },
        include: {
          customerAddress: true,
        },
      });

      await prisma.customerAddress.update({
        where: {
          id: customerUpdated.customerAddress.id,
        },
        data: {
          postalCode: editCustomer.postalCode,
          state: editCustomer.state,
          city: editCustomer.city,
          address: editCustomer.address,
          district: editCustomer.district,
          number: editCustomer.number,
          complement: editCustomer.complement,
        },
      });
    });

    const customerUpdated = await this.prismaService.customer.findUnique({
      where: {
        id: customerId,
      },
      include: {
        customerAddress: true,
        deal: true,
      },
    });

    // Criando historico de alteração
    await this.prismaService.customerRegistrationHistory.create({
      data: {
        customerId: customerUpdated.id,
        idUserEditor: userId,
        version: customerUpdated.version,
        update: JSON.stringify(customerUpdated),
      },
    });

    return customerUpdated;
  }

  async deactivateCustomerInStore(
    storeId: string,
    userId: string,
    customerId: string,
  ) {
    await this.validateStore(storeId);

    const customer = await this.prismaService.customer.findUnique({
      where: {
        id: customerId,
        storeId,
      },
    });

    if (!customer) {
      throw new AppErrorNotFound('None customer with this ID was found.');
    }

    if (customer.status === 'inactive') {
      throw new AppErrorConflict('This customer already is inactive.');
    }

    const customerUpdated = await this.prismaService.customer.update({
      where: {
        id: customerId,
      },
      data: {
        status: STATUS_CUSTOMER.INACTIVE,
        version: customer.version + 1,
      },
      include: {
        customerAddress: true,
      },
    });

    // Criando o historico de alteração
    await this.prismaService.customerRegistrationHistory.create({
      data: {
        customerId: customerUpdated.id,
        idUserEditor: userId,
        version: customerUpdated.version,
        update: JSON.stringify(customerUpdated),
      },
    });

    return {
      message: 'Customer inativado with success.',
    };
  }

  async enableCustomerInStore(
    storeId: string,
    userId: string,
    customerId: string,
  ) {
    await this.validateStore(storeId);

    const customer = await this.prismaService.customer.findUnique({
      where: {
        id: customerId,
        storeId,
      },
    });

    if (!customer) {
      throw new AppErrorNotFound('None customer with this ID was found.');
    }

    if (customer.status === 'active') {
      throw new AppErrorConflict('This customer already is active.');
    }

    const customerUpdated = await this.prismaService.customer.update({
      where: {
        id: customerId,
      },
      data: {
        status: STATUS_CUSTOMER.ACTIVE,
        version: customer.version + 1,
      },
      include: {
        customerAddress: true,
      },
    });

    // Criando o historico de alteração
    await this.prismaService.customerRegistrationHistory.create({
      data: {
        customerId: customerUpdated.id,
        idUserEditor: userId,
        version: customerUpdated.version,
        update: JSON.stringify(customerUpdated),
      },
    });

    return {
      message: 'Customer ativado with success.',
    };
  }

  async importCustomers(
    storeId: string,
    userId: string,
    file: Express.Multer.File,
    app: 'autoConf' | 'resellerMore' = 'autoConf',
  ) {
    await this.validateStore(storeId);

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    if (app === 'resellerMore') {
      return this.importResellerMore(storeId, userId, data);
    }

    return this.importAutoConf(storeId, userId, data);
  }

  private async importAutoConf(storeId: string, userId: string, data: any[]) {
    let customersCreated = 0;
    let customersIgnored = 0;

    for (const row of data) {
      const taxId = row['CPF\\TAXID']
        ? String(row['CPF\\TAXID']).replace(/\D/g, '')
        : '';
      const email = row['Email'];
      const name = row['Name\\Legal name'];

      if (!taxId && !email) {
        customersIgnored++;
        continue;
      }

      const existingCustomer = await this.prismaService.customer.findFirst({
        where: {
          storeId,
          OR: [{ taxId: taxId || undefined }, { email: email || undefined }],
        },
      });

      if (existingCustomer) {
        customersIgnored++;
        continue;
      }

      const addressParsed = this.parseAddress(row['Address']);
      const typePerson = taxId.length > 11 ? 'legalEntity' : 'individual';
      const birthDate = row['Data of birthday']
        ? this.parseData(row['Data of birthday'])
        : new Date();

      await this.prismaService
        .$transaction(async (prisma) => {
          const customer = await prisma.customer.create({
            data: {
              storeId,
              name: name || 'Customer Importado',
              typePerson,
              taxId: taxId || 'N/A',
              identityNumber: '',
              foreigner: false,
              gender: 'not_informado',
              birthDate,
              phone: row['Phone'] || '',
              whatsapp: row['Phone'] || '',
              email: email || '',
              version: 1,
              notes: 'Importado via Excel (AutoConf)',
              status: 'active',
            },
          });

          await prisma.customerAddress.create({
            data: {
              customerId: customer.id,
              ...addressParsed,
            },
          });

          await prisma.customerRegistrationHistory.create({
            data: {
              customerId: customer.id,
              idUserEditor: userId,
              version: 1,
              update: JSON.stringify(customer),
            },
          });
        })
        .then(() => {
          customersCreated++;
        })
        .catch((err) => {
          console.error('Failed to import customer:', err);
          customersIgnored++;
        });
    }

    return {
      message: 'Import completed (AutoConf).',
      details: {
        created: customersCreated,
        ignored: customersIgnored,
      },
    };
  }

  private async importResellerMore(
    storeId: string,
    userId: string,
    data: any[],
  ) {
    let customersCreated = 0;
    let customersIgnored = 0;

    for (const row of data) {
      const taxId = row['cpf_taxId']
        ? String(row['cpf_taxId']).replace(/\D/g, '')
        : '';
      const email = row['email'];
      const name = row['name'];

      if (!taxId && !email) {
        customersIgnored++;
        continue;
      }

      const existingCustomer = await this.prismaService.customer.findFirst({
        where: {
          storeId,
          OR: [{ taxId: taxId || undefined }, { email: email || undefined }],
        },
      });

      if (existingCustomer) {
        customersIgnored++;
        continue;
      }

      const typePerson =
        row['person'] === 'Legal entity' ? 'legalEntity' : 'individual';
      const birthDate = row['data_birth']
        ? this.parseData(row['data_birth'])
        : new Date();
      const phone =
        row['phone_mobile'] ||
        row['phone_residencial'] ||
        row['phone_comercial'] ||
        '';

      await this.prismaService
        .$transaction(async (prisma) => {
          const customer = await prisma.customer.create({
            data: {
              storeId,
              name: name || 'Customer Importado',
              typePerson,
              taxId: taxId || 'N/A',
              identityNumber: row['identityNumber'] || '',
              foreigner: false,
              gender:
                row['sexo'] === 'Masculino'
                  ? 'masculino'
                  : row['sexo'] === 'Feminino'
                    ? 'feminino'
                    : 'not_informado',
              birthDate,
              phone: phone,
              whatsapp: row['phone_mobile'] || '',
              email: email || '',
              version: 1,
              notes: 'Importado via Excel (ResellerMore)',
              status: 'active',
            },
          });

          await prisma.customerAddress.create({
            data: {
              customerId: customer.id,
              postalCode: row['postalCode']
                ? String(row['postalCode']).replace(/\D/g, '')
                : '',
              state: row['state'] || '',
              city: row['city'] || '',
              address: row['street'] || '',
              district: row['district'] || '',
              number: row['number'] ? String(row['number']) : '',
              complement: row['complement'] || '',
            },
          });

          await prisma.customerRegistrationHistory.create({
            data: {
              customerId: customer.id,
              idUserEditor: userId,
              version: 1,
              update: JSON.stringify(customer),
            },
          });
        })
        .then(() => {
          customersCreated++;
        })
        .catch((err) => {
          console.error('Failed to import customer:', err);
          customersIgnored++;
        });
    }

    return {
      message: 'Import completed (ResellerMore).',
      details: {
        created: customersCreated,
        ignored: customersIgnored,
      },
    };
  }

  private parseAddress(addressComplete: string) {
    if (!addressComplete) {
      return {
        postalCode: '',
        state: '',
        city: '',
        address: '',
        district: '',
        number: '',
        complement: '',
      };
    }

    try {
      const parts = addressComplete.split(',').map((p) => p.trim());
      // parts[0] = Rua
      // parts[1] = Numero
      // parts[2] = Complemento - Bairro - Cidade - UF
      // parts[3] = CEP

      let street = parts[0] || '';
      let number = parts[1] || '';
      let postalCode = parts[parts.length - 1] || '';

      let middle = parts.slice(2, parts.length - 1).join(', ');

      let district = '';
      let city = '';
      let state = '';
      let complement = '';

      if (middle) {
        const middleParts = middle.split('-').map((p) => p.trim());

        if (middleParts.length > 0) state = middleParts[middleParts.length - 1];
        if (middleParts.length > 1) city = middleParts[middleParts.length - 2];
        if (middleParts.length > 2)
          district = middleParts[middleParts.length - 3];
        if (middleParts.length > 3)
          complement = middleParts.slice(0, middleParts.length - 3).join(' - ');
        else if (middleParts.length === 1) complement = middleParts[0];
      }

      postalCode = postalCode.replace(/\D/g, '');
      if (postalCode.length !== 8) postalCode = '';

      return {
        postalCode,
        state,
        city,
        address: street,
        district,
        number,
        complement,
      };
    } catch (and) {
      return {
        postalCode: '',
        state: '',
        city: '',
        address: addressComplete,
        district: '',
        number: '',
        complement: '',
      };
    }
  }

  private parseData(dataString: string): Date {
    if (!dataString) return new Date();
    try {
      const parts = dataString.split('/');
      if (parts.length === 3) {
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
    } catch (and) {
      return new Date();
    }
    return new Date();
  }
}
