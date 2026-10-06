import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { FileService } from 'src/persistence/files/file/file.service';
import {
  AppErrorBadRequest,
  AppErrorInternal,
  AppErrorNotFound,
} from 'src/utils/errors/app-errors';

@Injectable()
export class AvatarService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly fileService: FileService,
  ) {}

  async saveAvatar(userId: string, file: Express.Multer.File) {
    if (!userId) throw new AppErrorNotFound('User not found');
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
      entity: 'avatar',
      userId: userId,
      entityId: userId,
    });

    if (!storeLogo || !storeLogo.url)
      throw new AppErrorInternal('Failed to save o avatar of user');

    await this.prismaService.user.update({
      where: { id: userId },
      data: { photoUrl: storeLogo.url },
    });

    return {
      message: 'Avatar of user updated with success',
      url: storeLogo.url,
    };
  }

  async deleteAvatar(userId: string) {
    if (!userId) throw new AppErrorNotFound('User not found');

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { photoUrl: true },
    });

    if (!user) throw new AppErrorNotFound('User not found.');
    const deleted = await this.fileService.deletePath(user.photoUrl);
    if (!deleted)
      throw new AppErrorInternal('Failed to delete o avatar of user');

    await this.prismaService.user.update({
      where: { id: userId },
      data: { photoUrl: null },
    });

    return { message: 'Avatar of user deleted with success' };
  }

  async getAvatarUrl(userId: string) {
    if (!userId) throw new AppErrorNotFound('User not found');

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { photoUrl: true },
    });

    if (!user) throw new AppErrorNotFound('User not found');
    return user.photoUrl || null;
  }
}
