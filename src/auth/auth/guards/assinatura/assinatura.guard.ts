import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { USUARIO_STATUS } from '../../../../utils/enum/usuario-status.enum';
import { AppErrorUnauthorized } from 'src/utils/errors/app-errors';

interface User {
  id: string;
  idLoja: string;
  email: string;
  perfil: string;
}

@Injectable()
export class AssinaturaGuard implements CanActivate {
  constructor(private readonly prismaService: PrismaService) {}

  private async validatePlan(idLoja: string): Promise<boolean> {
    const loja = await this.prismaService.loja.findUnique({
      where: {
        id: idLoja,
      },
      include: {
        assinatura: {
          where: {
            status: USUARIO_STATUS.ATIVO,
          },
        },
      },
    });

    if (!loja?.assinatura) {
      throw new AppErrorUnauthorized(
        'Esta loja não possui uma assinatura ativa.',
      );
    }

    return true;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const user = request.user as User;

    if (!user?.idLoja) {
      throw new AppErrorUnauthorized(
        'Esta loja não possui uma assinatura ativa.',
      );
    }

    return await this.validatePlan(user.idLoja);
  }
}
