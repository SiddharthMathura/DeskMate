import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config';
import healthRouter from './routes/health';

const app = express();

// Application Middleware Layers
app.use(cors({ 
    origin: config.frontendOrigin, 
    credentials: true 
}));
app.use(express.json());
app.use(cookieParser());

// REST Routers
app.use('/api/health', healthRouter);

// Fallback 404 Route (Catch - all)
app.use((_req : Request, res: Response) => {
    res.status(404).json({ error: 'Route Not Found' });
});

// Global Error Handling Middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled Application Exception Error Context:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

export default app;