import { HttpException } from "@nestjs/common";

export abstract class AppError extends Error {
    abstract toHTTPResponse(): HttpException 
}

export class AppErrorBadRequest extends AppError {
    toHTTPResponse() {
        return new HttpException(this.message, 400);
    }
}

export class AppErrorUnauthorized extends AppError {
    toHTTPResponse() {
        return new HttpException(this.message, 401);
    }
}

export class AppErrorForbidden extends AppError {
    toHTTPResponse() {
        return new HttpException(this.message, 403);
    }
}

export class AppErrorNotFound extends AppError {
    toHTTPResponse() {
        return new HttpException(this.message, 404);
    }
}

export class AppErrorConflict extends AppError {
    toHTTPResponse() {
        return new HttpException(this.message, 409);
    }
}

export class AppErrorInternal extends AppError {
    toHTTPResponse() {
        return new HttpException(this.message, 500);
    }
}

export class AppErrorNotImplemented extends AppError {
    toHTTPResponse() {
        return new HttpException(this.message, 501);
    }
}