import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { IsArray } from 'class-validator';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import {
  AppErrorBadRequest,
  AppErrorNotFound,
} from 'src/utils/errors/app-errors';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { CreateFaqDto } from './dto/create-faq.dto';
import { ListFaqDto } from './dto/list-faq.dto';
import { FileService } from 'src/persistence/files/file/file.service';
import { generateStringUrlImagePublic } from 'src/utils/imagePublicUtils';

@Injectable()
export class FaqService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly fileService: FileService,
  ) {}

  private FaqSelectList: Prisma.FaqSelect = {
    id: true,
    title: true,
    category: true,
    status: true,
    summary: true,
    views: true,
    createdAt: true,
    updatedAt: true,
    tags: {
      select: {
        name: true,
      },
    },
  };

  private async formatTags(faqs) {
    if (IsArray(faqs) && faqs.length > 0) {
      return faqs.map((faq) => ({
        ...faq,
        tags: faq.tags?.map((tag) => tag.name.toLowerCase()) || [],
      }));
    }

    return {
      ...faqs,
      tags: faqs.tags?.map((tag) => tag.name.toLowerCase()) || [],
    };
  }

  private async normalizeSlug(slug: string) {
    slug = slug
      .toLowerCase()
      .normalize('NFD')
      // Remove acentos
      .replace(/[\u0300-\u036f]/g, '')
      // Remove caracteres especiais
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      // Troca espaços por hífens
      .replace(/\s+/g, '-')
      // Remove hífens repetidos
      .replace(/-+/g, '-');

    // como resolver o erro do meu carro?
    //como-resolver-o-erro-do-meu-carro-2
    //como-resolver-o-erro-do-meu-carro-3

    const slugsExisting = await this.prismaService.faq.findMany({
      where: { slug: { startsWith: slug } },
      select: { slug: true },
    });

    if (slugsExisting.length === 0) {
      return slug;
    }

    let greaterNumber = 0;
    for (const item of slugsExisting) {
      const parts = item.slug.split('-');
      const number = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(number)) {
        greaterNumber = Math.max(greaterNumber, number);
      }
    }

    return `${slug}-${greaterNumber + 1}`;
  }

  private async editTags(idFaq: string, tags: string[], prisma) {
    const faq = await prisma.faq.findUnique({
      where: { id: idFaq },
      select: {
        id: true,
        tags: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!faq) {
      throw new AppErrorNotFound('Faq not found');
    }

    if (!tags) {
      return faq;
    }

    let tagsExisting = faq.tags.map((tag) => tag.name.toLowerCase());

    if (!tagsExisting) {
      return await prisma.faq.update({
        where: { id: idFaq },
        include: {
          tags: {
            select: {
              name: true,
            },
          },
        },
        data: {
          tags: {
            connectOrCreate: tags.map((nameTag) => ({
              where: { name: nameTag.toLowerCase() },
              create: { name: nameTag.toLowerCase() },
            })),
          },
        },
      });
    }

    const tagsForRemove = tagsExisting.filter((tag) => !tags.includes(tag));

    const tagsForAdd = tags.filter((tag) => !tagsExisting.includes(tag));

    if (tagsForRemove.length > 0) {
      await prisma.faq.update({
        where: { id: idFaq },
        data: {
          tags: {
            disconnect: tagsForRemove.map((tag) => ({ name: tag })),
          },
        },
      });
    }

    if (tagsForAdd.length > 0) {
      return await prisma.faq.update({
        where: { id: idFaq },
        include: {
          tags: {
            select: {
              name: true,
            },
          },
        },
        data: {
          tags: {
            connectOrCreate: tagsForAdd.map((nameTag) => ({
              where: { name: nameTag.toLowerCase() },
              create: { name: nameTag.toLowerCase() },
            })),
          },
        },
      });
    }
  }

  private async getImagePublicUrl(fileId: string) {
    const file = await this.prismaService.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new AppErrorNotFound('File not found');
    }

    const filePublic = await this.fileService.getFileById(file.id);

    if (!filePublic) {
      throw new AppErrorNotFound('File public not found');
    }

    return filePublic.url;
  }

  private validateLimitFiles(files: Express.Multer.File[]) {
    if (!files || files?.length === 0) {
      throw new AppErrorBadRequest('None file sent');
    }

    if (files.length > 1) {
      throw new AppErrorBadRequest('You can send only a file');
    }

    return files[0];
  }

  async createFaq(data: CreateFaqDto) {
    const slug = await this.normalizeSlug(data.title);
    const summary = `${data.content.substring(0, 100)}...`;

    const { tags, ...faqData } = data;

    const reply = await this.prismaService.$transaction(async (prisma) => {
      const faqCreated = await prisma.faq.create({
        data: {
          ...faqData,
          slug: slug,
          summary: summary,
        },
      });
      return await this.editTags(faqCreated.id, data.tags, prisma);
    });

    return reply;
  }

  async editFaq(id: string, data: UpdateFaqDto) {
    const slug = data.title ? await this.normalizeSlug(data.title) : {};
    const summary = data.content ? `${data.content.substring(0, 100)}...` : {};

    const { tags, ...faqData } = data;

    const reply = this.prismaService.$transaction(async (prisma) => {
      await prisma.faq.update({
        where: { id },
        data: {
          ...faqData,
          slug: slug,
          summary: summary,
        },
      });
      return await this.editTags(id, data.tags, prisma);
    });

    return reply;
  }

  async listFaqs(filters: ListFaqDto) {
    const { status, category, tags } = filters;

    const page = filters.page ? parseInt(filters.page) : 1;
    const limit = filters.limit ? parseInt(filters.limit) : 10;
    const search = filters.search ? filters.search : '';

    const tagsArray = tags ? tags.split(',') : [];

    let where: Prisma.FaqWhereInput = {
      AND: [
        {
          OR: [
            {
              title: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              content: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        },
        status ? { status: filters.status } : {},
        category ? { category: filters.category } : {},
        tagsArray && tagsArray.length > 0
          ? {
              tags: {
                some: {
                  name: {
                    in: tagsArray,
                  },
                },
              },
            }
          : {},
        { status: 'published' },
      ],
    };

    const faqs = await this.prismaService.faq.findMany({
      where,
      select: this.FaqSelectList,
      skip: (page - 1) * limit,
      take: limit,
    });

    const replyFormatted = await this.formatTags(faqs);

    return replyFormatted;
  }

  async getFaqById(id: string) {
    const faq = await this.prismaService.faq.findUnique({
      where: { id },
      include: { tags: true },
    });

    if (!faq) {
      throw new AppErrorNotFound('Faq not found');
    }
    const replyFormatted = await this.formatTags(faq);
    return replyFormatted;
  }

  async getFaqBySlug(slug: string) {
    const faq = await this.prismaService.faq.findUnique({
      where: { slug },
      include: { tags: true },
    });

    if (!faq) {
      throw new AppErrorNotFound('Faq not found');
    }
    const replyFormatted = await this.formatTags(faq);
    return replyFormatted;
  }

  async countViews(id: string) {
    await this.getFaqById(id);

    return await this.prismaService.faq.update({
      where: { id },
      data: {
        views: { increment: 1 },
      },
    });
  }

  async deleteFaq(id: string) {
    await this.getFaqById(id);
    return await this.prismaService.faq.delete({
      where: { id },
    });
  }

  async saveImagePublic(params: {
    userId: string;
    file: Express.Multer.File[];
  }) {
    const file = this.validateLimitFiles(params.file);

    const reply = await this.prismaService.$transaction(async (prisma) => {
      const publicImage = await prisma.publicImage.create({});

      const fileSaved = await this.fileService.saveFile({
        file: file,
        entity: 'image_public',
        userId: params.userId,
        entityId: publicImage.id,
      });

      await prisma.publicImage.update({
        where: { id: publicImage.id },
        data: {
          fileId: fileSaved.id,
        },
      });

      const url = generateStringUrlImagePublic({
        imageId: publicImage.id,
      });

      return {
        url,
      };
    });

    return reply;
  }

  async getImagePublic(id: string) {
    const publicImage = await this.prismaService.publicImage.findUnique({
      where: { id },
    });

    if (!publicImage) {
      throw new AppErrorNotFound('Image public not found');
    }

    return await this.getImagePublicUrl(publicImage.fileId);
  }
}
