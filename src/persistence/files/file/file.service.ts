import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { File, UuidFile } from '@prisma/client';
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
  ) {}

  private async relateFile(params: {
    userId: string;
    entity: string;
    entityId: string;
    name: string;
    size?: number;
    type: string;
    url: string;
    expiresAt: Date;
  }): Promise<File> {
    try {
      const attachment = await this.prisma.file.create({
        data: {
          ...params,
        },
      });
      return attachment;
    } catch (error) {
      throw new AppErrorInternal(
        'Failed to create record of attachment in bank',
      );
    }
  }

  private async relateFileUUID(params: {
    name: string;
    type: string;
    url: string;
    expiresAt: Date;
  }): Promise<UuidFile> {
    try {
      const attachment = await this.prisma.uuidFile.create({
        data: {
          name: params.name,
          type: params.type,
          url: params.url,
          expiresAt: params.expiresAt,
        },
      });
      return attachment;
    } catch (error) {
      throw new AppErrorInternal(
        'Failed to create record of attachment in bank',
      );
    }
  }

  private async uploadFile(file: Express.Multer.File): Promise<string[]> {
    if (!file) {
      throw new AppErrorBadRequest('None file was sent.');
    }
    if (!file.originalname) {
      throw new AppErrorBadRequest('Name of file invalid.');
    }

    try {
      // Use o FirebaseService para fazer o upload do arquivo
      const [key, url] = await this.firebaseService.uploadFile(file);
      return [key, url];
    } catch (error) {
      throw new AppErrorInternal(
        `Failed to perform upload of file: ${error.message}`,
      );
    }
  }

  async saveFile(params: {
    file: Express.Multer.File;
    userId: string;
    entity: string;
    entityId: string;
  }): Promise<File> {
    const { file, userId, entity, entityId } = params;

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
      // Adicionanto all os documentos common
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
        `Type of file invalid. Accepts one of these types: ${allowedMimeTypes.join(', ')}`,
      );
    }

    try {
      //pegando a extensão of file
      const extension = file.originalname.split('.').pop();

      //criando um name unique random for o file
      const nameForControl = `${userId}-${entity}-${entityId}.${extension}`;

      // sanitizando and alterando o name of file for um name único
      const originalName = file.originalname;
      file.originalname = nameForControl;

      // Faz o upload of file
      const [key, url] = await this.uploadFile(file);

      // 5 days in futuro
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 5);

      // Cria um registro of file in bank of data
      const attachment = await this.relateFile({
        userId,
        entity,
        entityId,
        name: key,
        size: file.size,
        type: file.mimetype,
        url: url,
        expiresAt: expiresAt,
      });

      // Restaura o name original of file (for não afetar outras operações)
      file.originalname = originalName;

      return attachment;
    } catch (error) {
      throw new AppErrorInternal(`Failed to save file: ${error.message}`);
    }
  }

  async saveFileUUID(params: {
    file: Express.Multer.File;
    allowedMimeTypes: string[];
  }): Promise<UuidFile> {
    const { file, allowedMimeTypes } = params;

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new AppErrorBadRequest(
        `Type of file invalid. Accepts one of these types: ${allowedMimeTypes.join(', ')}`,
      );
    }

    try {
      const uuid = uuidv4();

      //pegando a extensão of file
      const extension = file.originalname.split('.').pop();

      //criando um name unique random for o file
      const nameForControl = `${uuid}.${extension}`;

      // Preserva o name original
      const originalName = file.originalname;

      // sanitizando and alterando o name of file for um name único
      file.originalname = nameForControl;

      // Faz o upload of file
      const [key, url] = await this.uploadFile(file);

      // 5 days in futuro
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 5);

      // Cria um registro of file in bank of data
      const attachment = await this.relateFileUUID({
        name: key,
        type: file.mimetype,
        url: url,
        expiresAt: expiresAt,
      });

      // Restaura o name original
      file.originalname = originalName;

      return attachment;
    } catch (error) {
      throw new AppErrorInternal(`Failed to save file UUID: ${error.message}`);
    }
  }

  async getFile(params: {
    entity: string;
    entityId: string;
    userId: string;
  }): Promise<File | null> {
    const { entity, entityId, userId } = params;

    try {
      let attachment = await this.prisma.file.findFirst({
        where: {
          userId: userId,
          entity: entity,
          entityId: entityId,
        },
      });

      if (!attachment) {
        return null;
      }

      const expiresAtOfUrl = new Date(attachment.expiresAt);
      const deadlineSafe = new Date();
      deadlineSafe.setFullYear(deadlineSafe.getFullYear() + 9); // renovando a URL 1 year before of vencimento

      if (expiresAtOfUrl < deadlineSafe) {
        try {
          // renovando a URL
          const newDeadline = new Date();
          newDeadline.setFullYear(newDeadline.getFullYear() + 10); // 10 years in futuro
          const url = await this.firebaseService.fileUrl(attachment.name);
          attachment = await this.prisma.file.update({
            where: { id: attachment.id },
            data: {
              url: url,
              expiresAt: newDeadline,
            },
          });
        } catch (error) {
          throw new AppErrorInternal(
            `Failed to renovar URL of file: ${error.message}`,
          );
        }
      }

      return attachment;
    } catch (error) {
      if (error instanceof AppErrorInternal) {
        throw error;
      }
      throw new AppErrorInternal(`Failed to find file: ${error.message}`);
    }
  }

  async getFileById(id: string): Promise<File | null> {
    try {
      const attachment = await this.prisma.file.findUnique({
        where: { id: id },
      });

      if (!attachment) {
        return null;
      }

      return await this.getFile({
        entity: attachment.entity,
        entityId: attachment.entityId,
        userId: attachment.userId,
      });
    } catch (error) {
      throw new AppErrorInternal(`Failed to find file by ID: ${error.message}`);
    }
  }

  async updateEntity(params: {
    fileId: string;
    entity: string;
    entityId: string;
  }): Promise<File | null> {
    const { fileId, entity, entityId } = params;

    try {
      const attachment = await this.prisma.file.update({
        where: { id: fileId },
        data: {
          entity: entity,
          entityId: entityId,
        },
      });

      return attachment;
    } catch (error) {
      throw new AppErrorInternal(
        `Failed to update entity of file: ${error.message}`,
      );
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    try {
      const attachment = await this.prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!attachment) {
        throw new AppErrorNotFound('File not found');
      }

      await this.firebaseService.deleteFile(attachment.name);
      await this.prisma.file.delete({
        where: {
          id: fileId,
        },
      });

      return;
    } catch (error) {
      if (error instanceof AppErrorNotFound) {
        throw error;
      }
      throw new AppErrorInternal(`Failed to delete file: ${error.message}`);
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
      throw new AppErrorInternal(
        `Failed to get buffer of file: ${error.message}`,
      );
    }
  }

  async getUploadFileUrl(key: string): Promise<string> {
    try {
      return await this.firebaseService.getUploadFileUrl(key);
    } catch (error) {
      throw new AppErrorInternal(
        `Failed to get URL of upload: ${error.message}`,
      );
    }
  }
}
