import { Router } from 'express';
import * as ticketService from '../services/ticket.service';
import * as messageService from '../services/message.service';
import { generateDraftReply } from '../services/ai-draft';
import { logDraftRequest, listDraftRequestsByTicketId } from '../services/ai-draft-request.service';

const draftRouter = Router({ mergeParams: true });

// POST /api/tickets/:id/draft
draftRouter.post('/', async (req, res) => {
    const params = req.params as { id: string };
    const ticket = await ticketService.getTicketById(params.id);
    const thread = await messageService.listMessagesByTicketId(params.id);
    const result = await generateDraftReply(ticket, thread);

    logDraftRequest(ticket.id, result.promptSnapshot, result.draftText, result.modelUsed)
        .catch((err) => {
            console.error(`Failed to log AI draft request for ticket ${ticket.id}:`, err);
        });

    res.json({ draft: { draftText: result.draftText, modelUsed: result.modelUsed } });
});

// GET /api/tickets/:id/draft/history
draftRouter.get('/history', async (req, res) => {
    const params = req.params as { id: string };
    await ticketService.getTicketById(params.id);
    const history = await listDraftRequestsByTicketId(params.id);
    res.json({ draftRequests: history });
});

export default draftRouter;