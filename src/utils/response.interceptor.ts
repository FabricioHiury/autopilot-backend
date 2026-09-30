import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => {
        return {
          message: 'Operação realizada com sucesso.',
          statusCode: context.switchToHttp().getResponse().statusCode,
          data: data,
        };
      }),
      catchError((err) => {
        // encaminhando o erro para tratamento apropriado
        return throwError(() => err);
      }),
    );
  }
}