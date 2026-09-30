import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { FileService } from 'src/persistence/files/file/file.service';
import { AppErrorBadRequest } from 'src/utils/errors/app-errors';
import { ENUM_TIPO_AVATAR_EXTERNO } from './enum/tipo-avatar-externo.enum';

@Injectable()
export class AvatarExternoService {

    constructor(
        private readonly prismaService: PrismaService,
        private readonly fileService: FileService,
    ) {}

    private validarQuantidadeArquivos(files: Express.Multer.File[]) {
      if (!files || files?.length === 0) {
        return null;
      }

      if (files.length > 1) {
        throw new AppErrorBadRequest(
          'Mais de um arquivo foi enviado. Envie apenas um arquivo.',
        );
      }

      return files[0];
    }

    async salvarAvatar(params: {
        arquivos: Express.Multer.File[],
        idLoja: string,
        tipo: ENUM_TIPO_AVATAR_EXTERNO,
        id: string,
      }) {

        const { arquivos, idLoja, tipo, id } = params;

        const arquivo = this.validarQuantidadeArquivos(arquivos);

        const loja = await this.prismaService.loja.findUnique({
          where: { id: idLoja },
          include: { lojista: true },
        });

        if (!loja || !loja.lojista) {
          throw new Error(`Loja ${idLoja} não encontrada ou sem lojista associado`);
        }

        const idUsuario = loja.lojista.idUsuario;

        const arquivoSalvo = await this.fileService.salvarArquivo({
            file: arquivo,
            entidade: `avatar-externo-${tipo}`,
            usuarioId: idUsuario,
            entidadeId: id,
        });

        return arquivoSalvo;
    }

    async pegarUrlAvatar(params: {
        idLoja: string; 
        tipo: ENUM_TIPO_AVATAR_EXTERNO; 
        id: string;
    }) {

        const { idLoja, tipo, id } = params;
        
        const loja = await this.prismaService.loja.findUnique({
            where: { id: idLoja },
            include: { lojista: true },
        });

        if (!loja || !loja.lojista) {
            console.error(`Loja ${idLoja} não encontrada ou sem lojista associado`);
            return null;
        }

        const idUsuario = loja.lojista.idUsuario;

        const arquivo = await this.fileService.pegarArquivo({
          entidade: `avatar-externo-${tipo}`,
          entidadeId: id,
          usuarioId: idUsuario,
        });

        if (!arquivo) return null;

        return arquivo.url;
    }    
}
