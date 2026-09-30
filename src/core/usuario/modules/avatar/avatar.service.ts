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
  ) { }

  async saveAvatar(userId: string, file: Express.Multer.File) {
    if (!userId) throw new AppErrorNotFound('Usuário não encontrado');
    if (!file) throw new AppErrorNotFound('Arquivo não encontrado');

    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/webp', 'image/png'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new AppErrorBadRequest(`Tipo de arquivo inválido. São aceitos um dos seguintes tipos: ${allowedMimeTypes.join(', ')}`);
    }

    const storeLogo = await this.fileService.salvarArquivo({
      file: file,
      entidade: 'avatar',
      usuarioId: userId,
      entidadeId: userId,
    });

    if (!storeLogo || !storeLogo.url) throw new AppErrorInternal('Erro ao salvar o avatar do usuário');

    await this.prismaService.usuario.update({
      where: { id: userId },
      data: { urlFoto: storeLogo.url },
    });

    return {
      message: 'Avatar do usuário atualizado com sucesso',
      url: storeLogo.url,
    };
  }

  async deleteAvatar(userId: string) {
    if (!userId) throw new AppErrorNotFound('Usuário não encontrado');

    const user = await this.prismaService.usuario.findUnique({
      where: { id: userId },
      select: { urlFoto: true },
    });

    if (!user) throw new AppErrorNotFound('Usuário não encontrado.');
    const deleted = await this.fileService.deletePath(user.urlFoto);
    if (!deleted) throw new AppErrorInternal('Erro ao deletar o avatar do usuário');

    await this.prismaService.usuario.update({
      where: { id: userId },
      data: { urlFoto: null },
    });

    return { message: 'Avatar do usuário deletado com sucesso' };
  }

  async getAvatarUrl(userId: string) {
    if (!userId) throw new AppErrorNotFound('Usuário não encontrado');

    const user = await this.prismaService.usuario.findUnique({
      where: { id: userId },
      select: { urlFoto: true },
    });

    return user.urlFoto || null;
  }
}
