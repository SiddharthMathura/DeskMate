import { z } from 'zod';

export const ticketStatusEnum = z.enum(['open', 'pending', 'resolved', 'closed']);
export const ticketPriorityEnum = z.enum(['low', 'normal', 'high', 'urgent']);

export const createTicketSchema = z.object({
    customerId: z.string().uuid(),
    subject: z.string().min(1, 'Subject is required').max(500),
    priority: ticketPriorityEnum.optional().default('normal'),
});

export const patchTicketSchema = z
    .object({
        status: ticketStatusEnum.optional(),
        priority: ticketPriorityEnum.optional(),
        assignedAgentId: z.string().uuid().nullable().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: 'At least one field must be provided',
    });

const assignedAgentIdFilterSchema = z.union([
    z.literal('me'),
    z.literal('unassigned'),
    z.string().uuid(),
]);

export const listTicketsQuerySchema = z.object({
    status: ticketStatusEnum.optional(),
    priority: ticketPriorityEnum.optional(),
    assignedAgentId: assignedAgentIdFilterSchema.optional(),
    sortBy: z.enum(['createdAt', 'priority']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type PatchTicketInput = z.infer<typeof patchTicketSchema>;
export type ListTicketsQuery = z.infer<typeof listTicketsQuerySchema>;