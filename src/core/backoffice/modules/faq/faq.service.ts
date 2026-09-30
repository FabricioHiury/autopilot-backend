import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { IsArray } from 'class-validator';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import {
  AppErrorBadRequest,
  AppErrorNotFound,
} from 'src/utils/errors/app-errors';
import { AtualizarFaqDto } from './dto/atualizar-faq.dto';
import { CriarFaqDto } from './dto/criar-faq.dto';
import { ListarFaqDto } from './dto/listar-faq.dto';
import { FileService } from 'src/persistence/files/file/file.service';
import { gerarStringUrlImagemPublica } from 'src/utils/imagemPublicaUtils';

@Injectable()
export class FaqService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly fileService: FileService,
  ) {}

  private FaqSelectList: Prisma.FaqSelect = {
    id: true,
    titulo: true,
    categoria: true,
    status: true,
    resumo: true,
    views: true,
    criadoEm: true,
    atualizadoEm: true,
    tags: {
      select: {
        nome: true,
      },
    },
  };

  private async formataTags(faqs) {
    if (IsArray(faqs) && faqs.length > 0) {
      return faqs.map((faq) => ({
        ...faq,
        tags: faq.tags?.map((tag) => tag.nome.toLowerCase()) || [],
      }));
    }
    
    return {
      ...faqs,
      tags: faqs.tags?.map((tag) => tag.nome.toLowerCase()) || [],
    };
  }

  private async normalizaSlug(slug: string) {
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

    const slugsExistentes = await this.prismaService.faq.findMany({
      where: { slug: { startsWith: slug } },
      select: { slug: true },
    });

    if (slugsExistentes.length === 0) {
      return slug;
    }

    let maiorNumero = 0;
    for (const item of slugsExistentes) {
      const partes = item.slug.split('-');
      const numero = parseInt(partes[partes.length - 1], 10);
      if (!isNaN(numero)) {
        maiorNumero = Math.max(maiorNumero, numero);
      }
    }

    return `${slug}-${maiorNumero + 1}`;
  }

  private async editarTags(idFaq: string, tags: string[], prisma) {
    const faq = await prisma.faq.findUnique({
      where: { id: idFaq },
      select: {
        id: true,
        tags: {
          select: {
            nome: true,
          },
        },
      },
    });

    if (!faq) {
      throw new AppErrorNotFound('Faq não encontrado');
    }

    if (!tags) {
      return faq;
    }

    let tagsExistentes = faq.tags.map((tag) => tag.nome.toLowerCase());

    if (!tagsExistentes) {
      return await prisma.faq.update({
        where: { id: idFaq },
        include: {
          tags: {
            select: {
              nome: true,
            },
          },
        },
        data: {
          tags: {
            connectOrCreate: tags.map((nomeTag) => ({
              where: { nome: nomeTag.toLowerCase() },
              create: { nome: nomeTag.toLowerCase() },
            })),
          },
        },
      });
    }

    const tagsParaRemover = tagsExistentes.filter((tag) => !tags.includes(tag));

    const tagsParaAdicionar = tags.filter(
      (tag) => !tagsExistentes.includes(tag),
    );

    if (tagsParaRemover.length > 0) {
      await prisma.faq.update({
        where: { id: idFaq },
        data: {
          tags: {
            disconnect: tagsParaRemover.map((tag) => ({ nome: tag })),
          },
        },
      });
    }

    if (tagsParaAdicionar.length > 0) {
      return await prisma.faq.update({
        where: { id: idFaq },
        include: {
          tags: {
            select: {
              nome: true,
            },
          },
        },
        data: {
          tags: {
            connectOrCreate: tagsParaAdicionar.map((nomeTag) => ({
              where: { nome: nomeTag.toLowerCase() },
              create: { nome: nomeTag.toLowerCase() },
            })),
          },
        },
      });
    }
  }

  private async pegarImagemPublicaUrl(idArquivo: string) {
    const arquivo = await this.prismaService.arquivo.findUnique({
      where: { id: idArquivo },
    });

    if (!arquivo) {
      throw new AppErrorNotFound('Arquivo não encontrado');
    }

    const arquivoPublico = await this.fileService.pegarArquivoPorId(arquivo.id);

    if (!arquivoPublico) {
      throw new AppErrorNotFound('Arquivo público não encontrado');
    }

    return arquivoPublico.url;
  }

  private validarQuantidadeArquivos(files: Express.Multer.File[]) {
    if (!files || files?.length === 0) {
      throw new AppErrorBadRequest('Nenhum arquivo enviado');
    }

    if (files.length > 1) {
      throw new AppErrorBadRequest('Você pode enviar apenas um arquivo');
    }

    return files[0];
  }

  async criarFaq(data: CriarFaqDto) {
    const slug = await this.normalizaSlug(data.titulo);
    const resumo = `${data.conteudo.substring(0, 100)}...`;

    const { tags, ...faqData } = data;

    const resposta = await this.prismaService.$transaction(async (prisma) => {
      const faqCriada = await prisma.faq.create({
        data: {
          ...faqData,
          slug: slug,
          resumo: resumo,
        },
      });
      return await this.editarTags(faqCriada.id, data.tags, prisma);
    });

    return resposta;
  }

  async editarFaq(id: string, data: AtualizarFaqDto) {
    const slug = data.titulo ? await this.normalizaSlug(data.titulo) : {};
    const resumo = data.conteudo ? `${data.conteudo.substring(0, 100)}...` : {};

    const { tags, ...faqData } = data;

    const resposta = this.prismaService.$transaction(async (prisma) => {
      await prisma.faq.update({
        where: { id },
        data: {
          ...faqData,
          slug: slug,
          resumo: resumo,
        },
      });
      return await this.editarTags(id, data.tags, prisma);
    });

    return resposta;
  }

  async listarFaqs(filtros: ListarFaqDto) {
    const { status, categoria, tags } = filtros;

    const pagina = filtros.pagina ? parseInt(filtros.pagina) : 1;
    const quantidade = filtros.quantidade ? parseInt(filtros.quantidade) : 10;
    const pesquisa = filtros.pesquisa ? filtros.pesquisa : '';

    const tagsArray = tags ? tags.split(',') : [];

    let where: Prisma.FaqWhereInput = {
      AND: [
        {
          OR: [
            {
              titulo: {
                contains: pesquisa,
                mode: 'insensitive',
              },
            },
            {
              conteudo: {
                contains: pesquisa,
                mode: 'insensitive',
              },
            },
          ],
        },
        status ? { status: filtros.status } : {},
        categoria ? { categoria: filtros.categoria } : {},
        tagsArray && tagsArray.length > 0
          ? {
              tags: {
                some: {
                  nome: {
                    in: tagsArray,
                  },
                },
              },
            }
          : {},
        { status: 'publicado' },
      ],
    };

    const faqs = await this.prismaService.faq.findMany({
      where,
      select: this.FaqSelectList,
      skip: (pagina - 1) * quantidade,
      take: quantidade,
    });

    const respostaFormatada = await this.formataTags(faqs);

    return respostaFormatada;
  }

  async obterFaqPorId(id: string) {
    const faq = await this.prismaService.faq.findUnique({
      where: { id },
      include: { tags: true },
    });

    if (!faq) {
      throw new AppErrorNotFound('Faq não encontrado');
    }
    const respostaFormatada = await this.formataTags(faq);
    return respostaFormatada;
  }

  async obterFaqPorSlug(slug: string) {
    const faq = await this.prismaService.faq.findUnique({
      where: { slug },
      include: { tags: true },
    });

    if (!faq) {
      throw new AppErrorNotFound('Faq não encontrado');
    }
    const respostaFormatada = await this.formataTags(faq);
    return respostaFormatada;
  }

  async contarViews(id: string) {
    await this.obterFaqPorId(id);

    return await this.prismaService.faq.update({
      where: { id },
      data: {
        views: { increment: 1 },
      },
    });
  }

  async deletarFaq(id: string) {
    await this.obterFaqPorId(id);
    return await this.prismaService.faq.delete({
      where: { id },
    });
  }

  async salvarImagemPublica(params: {
    usuarioId: string;
    arquivo: Express.Multer.File[];
  }) {
    const arquivo = this.validarQuantidadeArquivos(params.arquivo);

    const resposta = await this.prismaService.$transaction(async (prisma) => {
      const imagemPublica = await prisma.imagemPublica.create({});

      const arquivoSalvo = await this.fileService.salvarArquivo({
        file: arquivo,
        entidade: 'imagem_publica',
        usuarioId: params.usuarioId,
        entidadeId: imagemPublica.id,
      });

      await prisma.imagemPublica.update({
        where: { id: imagemPublica.id },
        data: {
          idArquivo: arquivoSalvo.id,
        },
      });

      const url = gerarStringUrlImagemPublica({
        imagemId: imagemPublica.id,
      });

      return {
        url,
      };
    });

    return resposta;
  }

  async pegarImagemPublica(id: string) {
    const imagemPublica = await this.prismaService.imagemPublica.findUnique({
      where: { id },
    });

    if (!imagemPublica) {
      throw new AppErrorNotFound('Imagem pública não encontrada');
    }

    return await this.pegarImagemPublicaUrl(imagemPublica.idArquivo);
  }
}
