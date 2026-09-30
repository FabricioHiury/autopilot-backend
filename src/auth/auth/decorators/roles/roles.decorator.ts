import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const Roles = createParamDecorator(
    (_: never, context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest();
        const role = request.user.role;
        
        return role; 
    }
);