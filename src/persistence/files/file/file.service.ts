import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { Arquivo, ArquivoUUID } from '@prisma/client';
import {
  AppErrorBadRequest,
  AppErrorInternal,
  AppErrorNotFound,
} from 'src/utils/errors/app-errors';
import { uuidv4 } from 'uuidv7';

@Injectable()
export class FileService {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly prisma: PrismaService,
  ) { }

  private async relacionarArquivo(params: {
    usuarioId: string;
    entidade: string;
    entidadeId: string;
    nome: string;
    tamanho?: number;
    tipo: string;
    url: string;
    validade: Date;
  }): Promise<Arquivo> {
    try {
      const anexo = await this.prisma.arquivo.create({
        data: {
          ...params,
        },
      });
      return anexo;
    } catch (error) {
      throw new AppErrorInternal('Erro ao criar registro de anexo no banco');
    }
  }

  private async relacionarArquivoUUID(params: {
    nome: string;
    tipo: string;
    url: string;
    validade: Date;
  }): Promise<ArquivoUUID> {
    try {
      const anexo = await this.prisma.arquivoUUID.create({
        data: {
          nome: params.nome,
          tipo: params.tipo,
          url: params.url,
          validade: params.validade,
        },
      });
      return anexo;
    } catch (error) {
      throw new AppErrorInternal('Erro ao criar registro de anexo no banco');
    }
  }

  private async uploadArquivo(file: Express.Multer.File): Promise<string[]> {
    if (!file) {
      throw new AppErrorBadRequest('Nenhum arquivo foi enviado.');
    }
    if (!file.originalname) {
      throw new AppErrorBadRequest('Nome do arquivo inválido.');
    }

    try {
      // Use o FirebaseService para fazer o upload do arquivo
      const [key, url] = await this.firebaseService.uploadFile(file);
      return [key, url];
    } catch (error) {
      throw new AppErrorInternal(`Erro ao fazer upload do arquivo: ${error.message}`);
    }
  }

  async salvarArquivo(params: {
    file: Express.Multer.File;
    usuarioId: string;
    entidade: string;
    entidadeId: string;
  }): Promise<Arquivo> {
    const { file, usuarioId, entidade, entidadeId } = params;

    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/png',
      'application/pdf',
      'audio/midi',
      'audio/mpeg',
      'audio/webm',
      'audio/ogg',
      'audio/wav',
      'audio/mp4',
      'video/mpeg',
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/mov',
      'video/quicktime',
      'audio/ogg; codecs=opus',
      // Adicionanto todos os documentos comuns
      'application/vnd.ms-excel', // xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'application/msword', // doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
      'application/vnd.ms-powerpoint', // ppt
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
      'text/plain', // txt
      'text/csv', // csv
      'application/zip', // zip
      'application/vnd.rar', // rar
      'application/x-7z-compressed', // 7z
      'application/x-tar', // tar
      'application/gzip', // gz
      'application/x-bzip2', // bz2
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new AppErrorBadRequest(
        `Tipo de arquivo inválido. São aceitos um dos seguintes tipos: ${allowedMimeTypes.join(', ')}`,
      );
    }

    try {
      //pegando a extensão do arquivo
      const extensao = file.originalname.split('.').pop();

      //criando um nome unico aleatorio para o arquivo
      const nomeParaControle = `${usuarioId}-${entidade}-${entidadeId}.${extensao}`;

      // sanitizando e alterando o nome do arquivo para um nome único
      const originalName = file.originalname;
      file.originalname = nomeParaControle;

      // Faz o upload do arquivo
      const [key, url] = await this.uploadArquivo(file);

      // 5 dias no futuro
      const validade = new Date();
      validade.setDate(validade.getDate() + 5);

      // Cria um registro do arquivo no banco de dados
      const anexo = await this.relacionarArquivo({
        usuarioId,
        entidade,
        entidadeId,
        nome: key,
        tamanho: file.size,
        tipo: file.mimetype,
        url: url,
        validade: validade,
      });

      // Restaura o nome original do arquivo (para não afetar outras operações)
      file.originalname = originalName;

      return anexo;
    } catch (error) {
      throw new AppErrorInternal(`Erro ao salvar arquivo: ${error.message}`);
    }
  }

  async salvarArquivoUUID(params: {
    file: Express.Multer.File;
    allowedMimeTypes: string[];
  }): Promise<ArquivoUUID> {
    const { file, allowedMimeTypes } = params;

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new AppErrorBadRequest(
        `Tipo de arquivo inválido. São aceitos um dos seguintes tipos: ${allowedMimeTypes.join(', ')}`,
      );
    }

    try {
      const uuid = uuidv4();

      //pegando a extensão do arquivo
      const extensao = file.originalname.split('.').pop();

      //criando um nome unico aleatorio para o arquivo
      const nomeParaControle = `${uuid}.${extensao}`;

      // Preserva o nome original
      const originalName = file.originalname;

      // sanitizando e alterando o nome do arquivo para um nome único
      file.originalname = nomeParaControle;

      // Faz o upload do arquivo
      const [key, url] = await this.uploadArquivo(file);

      // 5 dias no futuro
      const validade = new Date();
      validade.setDate(validade.getDate() + 5);

      // Cria um registro do arquivo no banco de dados
      const anexo = await this.relacionarArquivoUUID({
        nome: key,
        tipo: file.mimetype,
        url: url,
        validade: validade,
      });

      // Restaura o nome original
      file.originalname = originalName;

      return anexo;
    } catch (error) {
      throw new AppErrorInternal(`Erro ao salvar arquivo UUID: ${error.message}`);
    }
  }

  async pegarArquivo(params: {
    entidade: string;
    entidadeId: string;
    usuarioId: string;
  }): Promise<Arquivo | null> {
    const { entidade, entidadeId, usuarioId } = params;

    try {
      let anexo = await this.prisma.arquivo.findFirst({
        where: {
          usuarioId: usuarioId,
          entidade: entidade,
          entidadeId: entidadeId,
        },
      });

      if (!anexo) {
        return null;
      }

      const validadeDaUrl = new Date(anexo.validade);
      const prazoSeguro = new Date();
      prazoSeguro.setFullYear(prazoSeguro.getFullYear() + 9); // renovando a URL 1 ano antes do vencimento

      if (validadeDaUrl < prazoSeguro) {
        try {
          // renovando a URL
          const novoPrazo = new Date();
          novoPrazo.setFullYear(novoPrazo.getFullYear() + 10); // 10 anos no futuro
          const url = await this.firebaseService.fileUrl(anexo.nome);
          anexo = await this.prisma.arquivo.update({
            where: { id: anexo.id },
            data: {
              url: url,
              validade: novoPrazo,
            },
          });
        } catch (error) {
          throw new AppErrorInternal(`Erro ao renovar URL do arquivo: ${error.message}`);
        }
      }

      return anexo;
    } catch (error) {
      if (error instanceof AppErrorInternal) {
        throw error;
      }
      throw new AppErrorInternal(`Erro ao buscar arquivo: ${error.message}`);
    }
  }

  async pegarArquivoPorId(id: string): Promise<Arquivo | null> {
    try {
      const anexo = await this.prisma.arquivo.findUnique({
        where: { id: id },
      });

      if (!anexo) {
        return null;
      }

      return await this.pegarArquivo({
        entidade: anexo.entidade,
        entidadeId: anexo.entidadeId,
        usuarioId: anexo.usuarioId,
      });
    } catch (error) {
      throw new AppErrorInternal(`Erro ao buscar arquivo por ID: ${error.message}`);
    }
  }

  async alterarEntidade(params: {
    idArquivo: string;
    entidade: string;
    entidadeId: string;
  }): Promise<Arquivo | null> {
    const { idArquivo, entidade, entidadeId } = params;

    try {
      const anexo = await this.prisma.arquivo.update({
        where: { id: idArquivo },
        data: {
          entidade: entidade,
          entidadeId: entidadeId,
        },
      });

      return anexo;
    } catch (error) {
      throw new AppErrorInternal(`Erro ao alterar entidade do arquivo: ${error.message}`);
    }
  }

  async deletarArquivo(arquivoId: string): Promise<void> {
    try {
      const anexo = await this.prisma.arquivo.findUnique({
        where: { id: arquivoId },
      });

      if (!anexo) {
        throw new AppErrorNotFound('Arquivo não encontrado');
      }

      await this.firebaseService.deleteFile(anexo.nome);
      await this.prisma.arquivo.delete({
        where: {
          id: arquivoId,
        },
      });

      return;
    } catch (error) {
      if (error instanceof AppErrorNotFound) {
        throw error;
      }
      throw new AppErrorInternal(`Erro ao deletar arquivo: ${error.message}`);
    }
  }

  async deletePath(path: string): Promise<boolean> {
    try {
      const deleted = await this.firebaseService.deletePath(path);
      return deleted;
    } catch (error) {
      return false;
    }
  }

  async getFileBuffer(key: string): Promise<Buffer> {
    try {
      return await this.firebaseService.getFileBuffer(key);
    } catch (error) {
      throw new AppErrorInternal(`Erro ao obter buffer do arquivo: ${error.message}`);
    }
  }

  async getUploadFileUrl(key: string): Promise<string> {
    try {
      return await this.firebaseService.getUploadFileUrl(key);
    } catch (error) {
      throw new AppErrorInternal(`Erro ao obter URL de upload: ${error.message}`);
    }
  }
}
