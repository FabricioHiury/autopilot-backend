import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { TagFiltersDto } from './dto/filter-tags.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { LinkTagsDto } from './dto/link-tags.dto';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async createTag(storeId: string, createTagDto: CreateTagDto) {
    const existingTag = await this.prisma.tag.findUnique({
      where: {
        nome_idLoja: {
          nome: createTagDto.name,
          idLoja: storeId,
        },
      },
    });

    if (existingTag) {
      throw new ConflictException('A tag with this name already exists in this store');
    }

    return this.prisma.tag.create({
      data: {
        nome: createTagDto.name,
        cor: createTagDto.color,
        descricao: createTagDto.description,
        idLoja: storeId,
      },
    });
  }

  async listTags(storeId: string, filters: TagFiltersDto) {
    const { page = 1, limit = 10, search } = filters;
    const skip = (page - 1) * limit;

    const whereCondition: any = {
      idLoja: storeId,
    };

    if (search) {
      whereCondition.nome = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const [tags, total] = await Promise.all([
      this.prisma.tag.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: {
          nome: 'asc',
        },
        include: {
          _count: {
            select: {
              atendimentoTags: true,
            },
          },
        },
      }),
      this.prisma.tag.count({
        where: whereCondition,
      }),
    ]);

    return {
      tags: tags.map((tag) => ({
        ...tag,
        totalTickets: tag._count.atendimentoTags,
        _count: undefined,
      })),
      total,
      page: page,
      limit: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getTagById(storeId: string, tagId: string) {
    const tag = await this.prisma.tag.findFirst({
      where: {
        id: tagId,
        idLoja: storeId,
      },
      include: {
        _count: {
          select: {
            atendimentoTags: true,
          },
        },
      },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    return {
      ...tag,
      totalTickets: tag._count.atendimentoTags,
      _count: undefined,
    };
  }

  async updateTag(
    storeId: string,
    tagId: string,
    updateTagDto: UpdateTagDto,
  ) {
    const tag = await this.prisma.tag.findFirst({
      where: {
        id: tagId,
        idLoja: storeId,
      },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    if (updateTagDto.name && updateTagDto.name !== tag.nome) {
      const existingTag = await this.prisma.tag.findUnique({
        where: {
          nome_idLoja: {
            nome: updateTagDto.name,
            idLoja: storeId,
          },
        },
      });

      if (existingTag) {
        throw new ConflictException(
          'A tag with this name already exists in this store',
        );
      }
    }

    return this.prisma.tag.update({
      where: {
        id: tagId,
      },
      data: {
        nome: updateTagDto.name,
        cor: updateTagDto.color,
        descricao: updateTagDto.description,
      },
    });
  }

  async deleteTag(storeId: string, tagId: string) {
    const tag = await this.prisma.tag.findFirst({
      where: {
        id: tagId,
        idLoja: storeId,
      },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    await this.prisma.tag.delete({
      where: {
        id: tagId,
      },
    });

    return { message: 'Tag deleted successfully' };
  }

  async linkTagsToTicket(
    storeId: string,
    ticketId: string,
    linkTagsDto: LinkTagsDto,
  ) {
    const ticket = await this.prisma.atendimento.findFirst({
      where: {
        id: ticketId,
        idLoja: storeId,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const tags = await this.prisma.tag.findMany({
      where: {
        id: {
          in: linkTagsDto.tags,
        },
        idLoja: storeId,
      },
    });

    if (tags.length !== linkTagsDto.tags.length) {
      throw new NotFoundException('One or more tags were not found');
    }

    await this.prisma.atendimentoTag.deleteMany({
      where: {
        idAtendimento: ticketId,
      },
    });

    const links = linkTagsDto.tags.map((tagId) => ({
      idAtendimento: ticketId,
      idTag: tagId,
    }));

    await this.prisma.atendimentoTag.createMany({
      data: links,
    });

    return { message: 'Tags linked successfully' };
  }

  async getTicketTags(storeId: string, ticketId: string) {
    const ticket = await this.prisma.atendimento.findFirst({
      where: {
        id: ticketId,
        idLoja: storeId,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const tags = await this.prisma.tag.findMany({
      where: {
        atendimentoTags: {
          some: {
            idAtendimento: ticketId,
          },
        },
        idLoja: storeId,
      },
      orderBy: {
        nome: 'asc',
      },
    });

    return tags;
  }

  async unlinkTagFromTicket(
    storeId: string,
    ticketId: string,
    tagId: string,
  ) {
    const ticket = await this.prisma.atendimento.findFirst({
      where: {
        id: ticketId,
        idLoja: storeId,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const link = await this.prisma.atendimentoTag.findFirst({
      where: {
        idAtendimento: ticketId,
        idTag: tagId,
        tag: {
          idLoja: storeId,
        },
      },
    });

    if (!link) {
      throw new NotFoundException('Link not found');
    }

    await this.prisma.atendimentoTag.delete({
      where: {
        id: link.id,
      },
    });

    return { message: 'Tag unlinked successfully' };
  }
}
