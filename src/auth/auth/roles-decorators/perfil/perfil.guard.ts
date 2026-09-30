import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { PERMISSOES_TODAS } from 'src/core/usuario/enum/permissoes_funcionalidades.enum';
import { AppErrorUnauthorized } from 'src/utils/errors/app-errors';

@Injectable()
export class PerfilGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
    ) { }

    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const perfis = this.reflector.get<string[]>('perfis', context.getHandler());
        if (!perfis)
            return true;

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        const validado = perfis.includes(user.perfil);

        if (!validado)
            throw new AppErrorUnauthorized('Usuário não possui permissão para acessar este recurso');

        return validado;
    }
}