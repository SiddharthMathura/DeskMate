import { Router } from 'express';
import * as ticketService from '../services/ticket.service';
import * as messageService from '../services/message.service';
import { generateDraftReply } from '../services/ai-draft';
import { logDraftRequest } from '../services/ai-draft-request.service';

const draftRouter = Router({ mergeParams: true });

// POST /api/tickets/:id/draft
draftRouter.post('/', async (req, res) => {
    const params = req.params as { id: string };
    const ticket = await ticketService.getTicketById(params.id); // throws NotFoundError if missing
    const thread = await messageService.listMessagesByTicketId(params.id);
    const result = await generateDraftReply(ticket, thread);

    // Non-blocking: a logging failure shouldn't stop the agent from getting
    // their draft. Errors are surfaced to the server console only.
    try {
        await logDraftRequest(ticket.id, result.promptSnapshot, result.draftText, result.modelUsed);
    } catch (err) {
        console.error(`Failed to log AI draft request for ticket ${ticket.id}:`, err);
    }

    res.json({ draft: { draftText: result.draftText, modelUsed: result.modelUsed } });
});

export default draftRouter;