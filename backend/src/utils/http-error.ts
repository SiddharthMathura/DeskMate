export class HttpError extends Error {
    statusCode: number;

    constructor(statusCode: number, message: string) {
        super(message);
        this.name = 'HttpError';
        this.statusCode = statusCode;
    }
}

export class NotFoundError extends HttpError {
    constructor(message = 'Resource not found') {
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

export class ValidationError extends HttpError {
    constructor(message = 'Validation failed') {
        super(400, message);
        this.name = 'ValidationError';
    }
}

export class ForbiddenError extends HttpError {
    constructor(message = 'Forbidden') {
        super(403, message);
        this.name = 'ForbiddenError';
    }
}