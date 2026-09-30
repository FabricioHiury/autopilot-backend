import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { ApiKeyService } from './guard.service';
import { AppErrorUnauthorized } from 'src/utils/errors/app-errors';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  canActivate(context: ExecutionContext): boolean {
    const request: Request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'] as string;

    if (!apiKey) {
      throw new AppErrorUnauthorized('API key is required');
    }

    if (!this.apiKeyService.validateApiKey(apiKey)) {
      throw new AppErrorUnauthorized('Invalid API key');
    }

    return true;
  }
}
