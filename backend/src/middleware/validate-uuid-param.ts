import { Request, Response, NextFunction, RequestParamHandler } from 'express';
import { z } from 'zod';
import { ValidationError } from '../utils/http-error';

const uuidSchema = z.string().uuid();

/**
 * Express router.param() handler factory. Validates that a route param
 * (e.g. :id) is a well-formed UUID before any route handler runs.
 * Throws ValidationError (-> 400 via central error middleware) on failure,
 * instead of letting a malformed id reach Prisma and blow up as a 500.
 *
 * Usage: ticketsRouter.param('id', validateUuidParam('Ticket id'));
 */
export function validateUuidParam(label: string): RequestParamHandler {
    return (req: Request, _res: Response, next: NextFunction, value: string) => {
        const result = uuidSchema.safeParse(value);
        if (!result.success) {
            next(new ValidationError(`${label} must be a valid UUID`));
            return;
        }
        next();
    };
}