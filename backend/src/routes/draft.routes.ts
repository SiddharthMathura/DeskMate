import { Router } from 'express';
import * as ticketService from '../services/ticket.service';
import * as messageService from '../services/message.service';
import { generateDraftReply } from '../services/ai-draft';

const draftRouter = Router({ mergeParams: true });

// POST /api/tickets/:id/draft
draftRouter.post('/', async (req, res) => {
    const params = req.params as { id: string };
    const ticket = await ticketService.getTicketById(params.id); // throws NotFoundError if missing
    const thread = await messageService.listMessagesByTicketId(params.id);
    const draft = await generateDraftReply(ticket, thread);
    res.json({ draft });
});

export default draftRouter;