import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { validateUuidParam } from '../middleware/validate-uuid-param';
import {
    createTicketSchema,
    patchTicketSchema,
    listTicketsQuerySchema,
} from '../schemas/ticket.schema';
import * as ticketService from '../services/ticket.service';
import messagesRouter from './message.routes';
import draftRouter from './draft.routes';

const ticketsRouter = Router();
ticketsRouter.use(requireAuth);
ticketsRouter.param('id', validateUuidParam('Ticket id'));

// GET /api/tickets?status=open&priority=high&assignedAgentId=me|unassigned|<uuid>&sortBy=priority&sortOrder=desc
ticketsRouter.get('/', async (req, res) => {
    const parsed = listTicketsQuerySchema.parse(req.query);
    const assignedAgentId = parsed.assignedAgentId === 'me' ? req.session!.userId : parsed.assignedAgentId;
    const tickets = await ticketService.listTickets({
        status: parsed.status,
        priority: parsed.priority,
        assignedAgentId,
        sortBy: parsed.sortBy,
        sortOrder: parsed.sortOrder,
    });
    res.json({ tickets });
});

// GET /api/tickets/:id
ticketsRouter.get('/:id', async (req, res) => {
    const ticket = await ticketService.getTicketById(req.params.id);
    res.json({ ticket });
});

// POST /api/tickets
ticketsRouter.post('/', async (req, res) => {
    const data = createTicketSchema.parse(req.body);
    const ticket = await ticketService.createTicket(data);
    res.status(201).json({ ticket });
});

// PATCH /api/tickets/:id
ticketsRouter.patch('/:id', async (req, res) => {
    const data = patchTicketSchema.parse(req.body);
    const ticket = await ticketService.updateTicket(req.params.id, data, req.session!);
    res.json({ ticket });
});

// POST /api/tickets/:id/claim
ticketsRouter.post('/:id/claim', async (req, res) => {
    const ticket = await ticketService.claimTicket(req.params.id, req.session!.userId);
    res.json({ ticket });
});

// GET/POST /api/tickets/:id/messages - nested message thread
ticketsRouter.use('/:id/messages', messagesRouter);

// POST /api/tickets/:id/draft - AI draft reply (mock -> real API later)
ticketsRouter.use('/:id/draft', draftRouter);

export default ticketsRouter;