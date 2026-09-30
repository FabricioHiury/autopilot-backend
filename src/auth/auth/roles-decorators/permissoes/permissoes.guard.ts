import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { Permissoes } from './permissoes.decorator';
import { USUARIO_PERFIL } from 'src/core/usuario/enum/perfil.enum';
import { USUARIO_STATUS } from '../../../../utils/enum/usuario-status.enum';
import { AppErrorUnauthorized } from 'src/utils/errors/app-errors';

@Injectable()
export class PermissoesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissoes = this.reflector.get(Permissoes, context.getHandler());
    if (!permissoes) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const retorno = await this.verificarPermissoes(permissoes, user.id);

    if (!retorno) {
      throw new AppErrorUnauthorized(
        'Usuário não possui permissão para acessar este recurso',
      );
    }

    return retorno;
  }

  private async verificarPermissoes(
    permissoes: string[],
    id: string,
  ): Promise<boolean> {
    const usuario = await this.prismaService.usuario.findUnique({
      where: {
        id: id,
      },
    });

    if (!usuario || usuario.status === USUARIO_STATUS.INATIVO) return false;

    const usuarioPermissoes = await this.prismaService.usuario.findUnique({
      where: {
        id: id,
      },
      select: {
        permissao: {
          where: {
            status: USUARIO_STATUS.ATIVO,
          },
        },
      },
    });
    if (!usuarioPermissoes) return false;

    const permissoesDoUsuario = usuarioPermissoes.permissao.map(
      (permissao) => permissao.funcionalidade,
    );

    return permissoesDoUsuario.some((permissao) =>
      permissoes.includes(permissao),
    );
  }
}
