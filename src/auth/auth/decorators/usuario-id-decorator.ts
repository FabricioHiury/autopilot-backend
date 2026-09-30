import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const UsuarioId = createParamDecorator(
  (_: never, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const userId = request.user.id;
    return userId;
  },
);
