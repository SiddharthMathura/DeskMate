import { Router } from 'express';
import { createMessageSchema } from '../schemas/message.schema';
import * as messageService from '../services/message.service';

// mergeParams lets this router see :id from the parent ticketsRouter mount
const messagesRouter = Router({ mergeParams: true });

// GET /api/tickets/:id/messages
messagesRouter.get('/', async (req, res) => {
    const params = req.params as { id: string };
    const messages = await messageService.listMessagesByTicketId(params.id);
    res.json({ messages });
});

// POST /api/tickets/:id/messages
messagesRouter.post('/', async (req, res) => {
    const params = req.params as { id: string };
    const data = createMessageSchema.parse(req.body);
    const message = await messageService.createMessage(params.id, req.session!.userId, data);
    res.status(201).json({ message });
});

export default messagesRouter;