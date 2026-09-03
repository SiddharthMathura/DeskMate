export class HttpError extends Error {
    statusCode: number;

    constructor(statusCode: number, message: string) {
        super(message);
        this.name = 'HttpError';
        this.statusCode = statusCode;
    }
}

export class NotFoundError extends HttpError {
    constructor(message = 'Resource not FOund') {
        super(404, message);
        this.name = 'NotFoundError';
    }
}

export class ConflictError extends HttpError {
    constructor(message = 'Conflict') {
        super(409, message);
        this.name = 'ConflictError';
    }
}