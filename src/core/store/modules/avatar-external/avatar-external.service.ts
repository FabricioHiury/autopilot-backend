import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { FileService } from 'src/persistence/files/file/file.service';
import { AppErrorBadRequest } from 'src/utils/errors/app-errors';
import { ENUM_TYPE_AVATAR_EXTERNAL } from './enum/type-avatar-external.enum';

@Injectable()
export class AvatarExternalService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly fileService: FileService,
  ) {}

  private validateLimitFiles(files: Express.Multer.File[]) {
    if (!files || files?.length === 0) {
      return null;
    }

    if (files.length > 1) {
      throw new AppErrorBadRequest('Upload exactly one file.');
    }

    return files[0];
  }

  async saveAvatar(params: {
    files: Express.Multer.File[];
    storeId: string;
    type: ENUM_TYPE_AVATAR_EXTERNAL;
    id: string;
  }) {
    const { files, storeId, type, id } = params;

    const file = this.validateLimitFiles(files);

    const store = await this.prismaService.store.findUnique({
      where: { id: storeId },
      include: { storeOwner: true },
    });

    if (!store || !store.storeOwner) {
      throw new Error(
        `Store ${storeId} not found or without storeOwner associated`,
      );
    }

    const userId = store.storeOwner.userId;

    const fileSaved = await this.fileService.saveFile({
      file: file,
      entity: `avatar-external-${type}`,
      userId: userId,
      entityId: id,
    });

    return fileSaved;
  }

  async getUrlAvatar(params: {
    storeId: string;
    type: ENUM_TYPE_AVATAR_EXTERNAL;
    id: string;
  }) {
    const { storeId, type, id } = params;

    const store = await this.prismaService.store.findUnique({
      where: { id: storeId },
      include: { storeOwner: true },
    });

    if (!store || !store.storeOwner) {
      console.error(
        `Store ${storeId} not found or without storeOwner associated`,
      );
      return null;
    }

    const userId = store.storeOwner.userId;

    const file = await this.fileService.getFile({
      entity: `avatar-external-${type}`,
      entityId: id,
      userId: userId,
    });

    if (!file) return null;

    return file.url;
  }
}
