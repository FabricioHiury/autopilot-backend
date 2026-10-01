import {
  ForbiddenException,
  ExecutionContext,
  createParamDecorator,
} from '@nestjs/common';

export const StoreId = createParamDecorator(
  (_: never, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const storeId = request.user?.storeId;
    if (!storeId) throw new ForbiddenException('A store session is required');
    return storeId;
  },
);
