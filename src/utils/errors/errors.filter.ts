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
        : 'Erro inesperado ocorreu';

    // Tratamento de erros customizados da aplicação
    if ( exception instanceof AppError) {
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
          message = `Conflito de dados detectado para o registro ${exception.meta.modelName} no campo ${exception.meta.target}.`;
          break;
        case 'P2003':
          status = HttpStatus.BAD_REQUEST;
          message = `Violação de chave estrangeira no registro ${exception.meta.modelName}.`;
          break;
        case 'P2004':
          status = HttpStatus.BAD_REQUEST;
          message = `Falha de restrição no modelo ${exception.meta.modelName}.`;
          break;
        case 'P2005':
          status = HttpStatus.BAD_REQUEST;
          message = `O valor armazenado na coluna não é válido para o tipo de coluna.`;
          break;
        case 'P2006':
          status = HttpStatus.BAD_REQUEST;
          message = `O valor fornecido para a coluna é inválido.`;
          break;
        case 'P2007':
          status = HttpStatus.BAD_REQUEST;
          message = `Os dados do registro estão em um formato inválido.`;
          break;
        case 'P2008':
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          message = `Erro ao validar a consulta Prisma.`;
          break;
        case 'P2009':
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          message = `Erro ao validar uma variável na consulta Prisma.`;
          break;
        case 'P2010':
          status = HttpStatus.UNAUTHORIZED;
          message = `Falha na autenticação.`;
          break;
        case 'P2011':
          status = HttpStatus.BAD_REQUEST;
          message = `Violação de restrição de chave exclusiva.`;
          break;
        case 'P2012':
          status = HttpStatus.BAD_REQUEST;
          message = `Violação de restrição de chave primária.`;
          break;
        case 'P2013':
          status = HttpStatus.BAD_REQUEST;
          message = `Nenhum campo de argumento foi fornecido para a relação.`;
          break;
        case 'P2014':
          status = HttpStatus.BAD_REQUEST;
          message = `O número de campos de argumento não corresponde ao esperado.`;
          break;
        case 'P2021':
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          message = `Tabela ${exception.meta.modelName} não encontrada no banco .`;;
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = `Registro não encontrado ${exception.meta.table}.`;;
          break;
        default:
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          message = 'Erro interno do servidor.';
          break;
      }
    }  else if (exception instanceof PrismaClientInitializationError) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      message = 'Falha ao inicializar o cliente do banco de dados.';
    } else if (exception instanceof PrismaClientRustPanicError) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Erro interno do cliente do banco de dados.';
    } else if (exception.message.includes('Transaction failed')) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Falha na transação do banco de dados.';
    } else if (exception instanceof BadRequestException) {
      status = HttpStatus.BAD_REQUEST;
      const response = exception.getResponse();
    
      // Verifica se a resposta é um objeto e tem a propriedade 'message'
      if (typeof response === 'object' && 'message' in response) {
        const details = response as { message: any };
    
        // Se 'message' for um array, junta em uma string, caso contrário, usa diretamente
        if (Array.isArray(details.message)) {
          message = details.message.join(', ');
        } else {
          message = details.message;
        }
      } else {
        // Se não for um objeto com a propriedade 'message', converte todo o objeto para string
        message = JSON.stringify(response);
      }
    }

    // Assegura que a mensagem seja uma string, caso a exceção traga um objeto como resposta
    if (typeof message !== 'string') {
      message = JSON.stringify(message);
    }

    console.error(`\x1b[31m(${exception.constructor.name}) -> Error ${status}:\x1b[37m ${message}\x1b[33m ${request.method} ${request.url}`);
    console.error(exception);

    response.status(status).json({
      message: message,
      statusCode: status,
      data: null,
    });
  }

}