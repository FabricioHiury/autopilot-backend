import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const Permissions = createParamDecorator(
    (_: never, context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest();
        const permission = request.user.permission;
        
        return permission; 
    }
);