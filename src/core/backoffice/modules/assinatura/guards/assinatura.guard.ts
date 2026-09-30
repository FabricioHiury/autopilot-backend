import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { STATUS_ASSINATURA } from 'src/utils/enum/assinatura.enum';

@Injectable()
export class AssinaturaGuard implements CanActivate {
  constructor(private readonly prismaService: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const idLoja = request.user?.idLoja;

    const loja = await this.prismaService.loja.findUnique({
      where: { id: idLoja },
      select: { integracoesLiberadas: true }
    });

    if (loja?.integracoesLiberadas === true) {
      return true;
    }

    const assinatura = await this.prismaService.assinatura.findFirst({
      where: {
        idLoja: idLoja,
        OR: [
          {
            status: STATUS_ASSINATURA.ATIVO,
          },
          {
            status: STATUS_ASSINATURA.CARENCIA,
            dataFimCarencia: {
              gte: new Date(), 
            },
          },
        ],
        plano: {
          status: STATUS_ASSINATURA.ATIVO,
        },
      },
      include: {
        plano: true,
      },
    });

    if (!assinatura) {
      throw new ForbiddenException(
        'Acesso negado. É necessária uma assinatura ativa para usar as integrações.',
      );
    }

    if (
      assinatura.status === STATUS_ASSINATURA.CARENCIA &&
      assinatura.dataFimCarencia &&
      new Date() > assinatura.dataFimCarencia
    ) {
      await this.prismaService.assinatura.update({
        where: { id: assinatura.id },
        data: {
          status: STATUS_ASSINATURA.INATIVO,
          dataFimCarencia: null,
        },
      });

      throw new ForbiddenException(
        'Período de carência expirado. É necessária uma assinatura ativa para usar as integrações.',
      );
    }

    return true;
  }
}
