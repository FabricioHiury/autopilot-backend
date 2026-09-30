import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const LojaId = createParamDecorator(
  (_: never, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const lojaId = request.user?.idLoja;
    return lojaId;
  },
);
