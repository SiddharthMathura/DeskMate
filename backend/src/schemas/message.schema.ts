import { z } from 'zod';

export const createMessageSchema = z.object({
    body: z.string().min(1, 'Message body is required').max(10000),
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;