import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  BadRequestException,
  HttpException,
} from '@nestjs/common';
import {
  PrismaClientKnownRequestError,
  PrismaClientInitializationError,
  PrismaClientRustPanicError,
} from '@prisma/client/runtime/library';
import { AppError } from './app-errors';

@Catch(Error)
export class AppErrorFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest<Request>();

    let status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    let message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Error An unexpected error occurred';

    // Tratamento de erros customizados da aplicação
    if (exception instanceof AppError) {
      const httpError = exception.toHTTPResponse();
      status = httpError.getStatus();
      message = httpError.message;
    }

    // Tratamento de erros de validação
    // vefirica se a exceção possui uma response com a propriedade message
    /*else if ( exception.response && exception.response.message ) {
      status = exception.status;
      message = exception.message
      // Se a mensagem for um array de erros de validação
      if (Array.isArray(exception.response.message) && exception.response.message.length > 0) {
        message = `${message}: `;
        // Concatena todos os erros em uma única string
        exception.response.message.map((error: string) => {
          message += error + '; ' ;
        })
        // remove o último '; '
        message = message.slice(0, -2);
      } 
    }*/

    // Tratamento de erros do Prisma
    if (exception instanceof PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          message = `Conflict of data detected for the record ${exception.meta.modelName} in field ${exception.meta.target}.`;
          break;
        case 'P2003':
          status = HttpStatus.BAD_REQUEST;
          message = `Violation of key foreign in record ${exception.meta.modelName}.`;
          break;
        case 'P2004':
          status = HttpStatus.BAD_REQUEST;
          message = `Failure of constraint in model ${exception.meta.modelName}.`;
          break;
        case 'P2005':
          status = HttpStatus.BAD_REQUEST;
          message = `The stored value is invalid for this column type.`;
          break;
        case 'P2006':
          status = HttpStatus.BAD_REQUEST;
          message = `The value provided for a column is invalid.`;
          break;
        case 'P2007':
          status = HttpStatus.BAD_REQUEST;
          message = `The record data has an invalid format.`;
          break;
        case 'P2008':
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          message = `Failed to validate a query Prisma.`;
          break;
        case 'P2009':
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          message = `Failed to validate a variable in query Prisma.`;
          break;
        case 'P2010':
          status = HttpStatus.UNAUTHORIZED;
          message = `Failure in authentication.`;
          break;
        case 'P2011':
          status = HttpStatus.BAD_REQUEST;
          message = `Violation of constraint of key unique.`;
          break;
        case 'P2012':
          status = HttpStatus.BAD_REQUEST;
          message = `Violation of constraint of key primary.`;
          break;
        case 'P2013':
          status = HttpStatus.BAD_REQUEST;
          message = `None field of argument was provided for a relation.`;
          break;
        case 'P2014':
          status = HttpStatus.BAD_REQUEST;
          message = `The number of arguments does not match the expected count.`;
          break;
        case 'P2021':
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          message = `Table ${exception.meta.modelName} not found in bank .`;
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = `Record not found ${exception.meta.table}.`;
          break;
        default:
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          message = 'Error internal of servidor.';
          break;
      }
    } else if (exception instanceof PrismaClientInitializationError) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      message = 'Failure to inicializar o customer of bank of data.';
    } else if (exception instanceof PrismaClientRustPanicError) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Error internal of customer of bank of data.';
    } else if (exception.message.includes('Transaction failed')) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Failure in transaction of bank of data.';
    } else if (exception instanceof BadRequestException) {
      status = HttpStatus.BAD_REQUEST;
      const response = exception.getResponse();

      // Verifica se a reply é um objeto and has a propriedade 'message'
      if (typeof response === 'object' && 'message' in response) {
        const details = response as { message: any };

        // Se 'message' for um array, junta at uma string, caso contrário, usa diretamente
        if (Array.isArray(details.message)) {
          message = details.message.join(', ');
        } else {
          message = details.message;
        }
      } else {
        // Se não for um objeto with a propriedade 'message', converte todo o objeto for string
        message = JSON.stringify(response);
      }
    }

    // Assegura que a message seja uma string, caso a exceção traga um objeto as reply
    if (typeof message !== 'string') {
      message = JSON.stringify(message);
    }

    console.error(
      `\x1b[31m(${exception.constructor.name}) -> Error ${status}:\x1b[37m ${message}\x1b[33m ${request.method} ${request.url}`,
    );
    console.error(exception);

    response.status(status).json({
      message: message,
      statusCode: status,
      data: null,
    });
  }
}
