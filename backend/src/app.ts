import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config';
import healthRouter from './routes/health';
import authRouter from './routes/auth.routes';
import { attachSession } from './middleware/auth.middleware';
import { ZodError } from 'zod';
import ticketsRouter from './routes/tickets.routes';
import { HttpError } from './utils/http-error';

const app = express();

// Application Middleware Layers
app.use(cors({ 
    origin: config.frontendOrigin, 
    credentials: true 
}));
app.use(express.json());
app.use(cookieParser());
app.use(attachSession);

// REST Routers
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/tickets', ticketsRouter);

// Fallback 404 Route (Catch - all)
app.use((_req : Request, res: Response) => {
    res.status(404).json({ error: 'Route Not Found' });
});

// Global Error Handling Middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ZodError) {
        res.status(400).json({ error: 'Validation failed', details: err.issues });
        return;
    }
    if (err instanceof HttpError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
    }
    console.error('Unhandled Application Exception Error Context:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

export default app;