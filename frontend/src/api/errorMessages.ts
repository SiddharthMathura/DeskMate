import { ApiError } from './client';

/**
* Turns an unknown thrown error into a user-facing message.
*
* - status 0 = a client-side outcome (cancel / timeout / network failure).
* - 401 = session expired
* - 5xx = generic server-side problem
* - everything else (400/403/404/409/etc.) = the server's own message
*/
export function getErrorMessage(err: unknown, fallback: string): string {
    if (err instanceof ApiError) {
        if (err.status === 0) return err.message;
        if (err.status === 401) return 'Your session has expired. Please log in again.';
        if (err.status >= 500) return 'The server had a problem. Please try again shortly.';
        return err.message;
    }
    return fallback;
}