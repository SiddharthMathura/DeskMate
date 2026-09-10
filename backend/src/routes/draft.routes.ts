import { Router } from 'express';
import * as ticketService from '../services/ticket.service';
import * as messageService from '../services/message.service';
import { generateDraftReply } from '../services/ai-draft';
import { MODEL as GEMINI_MODEL } from '../services/ai-draft/gemini';
import { logDraftRequest, listDraftRequestsByTicketId } from '../services/ai-draft-request.service';

const draftRouter = Router({ mergeParams: true });

const FAILED_SNAPSHOT_PLACEHOLDER = '[unavailable — draft generation failed before a prompt/response could be captured]';

function modelUsedForCurrentMode(): string {
    const mode = process.env.AI_DRAFT_MODE ?? 'mock';
    return mode === 'live' ? GEMINI_MODEL : 'mock';
}

// POST /api/tickets/:id/draft
draftRouter.post('/', async (req, res) => {
    const params = req.params as { id: string };
    const ticket = await ticketService.getTicketById(params.id);
    const thread = await messageService.listMessagesByTicketId(params.id);

    let result;
    try {
        result = await generateDraftReply(ticket, thread);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';

        logDraftRequest(
            ticket.id,
            FAILED_SNAPSHOT_PLACEHOLDER,
            `[FAILED] ${message}`,
            modelUsedForCurrentMode()
        ).catch((logErr) => {
            console.error(`Failed to log AI draft failure for ticket ${ticket.id}:`, logErr);
        });

        throw err; // re-throw unchanged so Express 5 error middleware still handles it
    }

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