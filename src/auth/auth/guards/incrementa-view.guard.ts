import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AppErrorUnauthorized } from 'src/utils/errors/app-errors';

@Injectable()
export class ViewApiKeyGuard implements CanActivate {
  private readonly apiKeyValid = process.env.VIEW_API_KEY;

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();

    const apiKey = request.headers['x-api-guard'];

    if (!apiKey || apiKey !== this.apiKeyValid) {
      throw new AppErrorUnauthorized('API Key invalid');
    }

    return true;
  }
}
