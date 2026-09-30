import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/is-public.decorator';

type JwtInfo =
  | { name?: 'TokenExpiredError' | 'JsonWebTokenError' | 'NotBeforeError'; message?: string }
  | any;

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info?: JwtInfo, _context?: any, _status?: number) {
    if (err || !user) {
      const name = info?.name;

      if (name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expirado.');
      }
      if (name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Token inválido.');
      }
      if (name === 'NotBeforeError') {
        throw new UnauthorizedException('Token não está ativo ainda (nbf).');
      }

      throw new UnauthorizedException('Sem autorização para acessar o conteúdo.');
    }

    return user;
  }
}
