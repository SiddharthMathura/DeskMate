import type * as ticketService from '../ticket.service';
import type * as messageService from '../message.service';
import { generateMockDraftReply } from './mock';
import { generateGeminiDraftReply } from './gemini';

export type TicketWithRelations = Awaited<ReturnType<typeof ticketService.getTicketById>>;
export type MessageWithRelations = Awaited<ReturnType<typeof messageService.listMessagesByTicketId>>[number];

export interface DraftReplyResult {
    draftText: string;
    modelUsed: string;
    // What was (or, for the mock, would be) sent to the model. Persisted to
    // ai_draft_requests.prompt_snapshot.
    promptSnapshot: string;
}

export async function generateDraftReply(
    ticket: TicketWithRelations,
    thread: MessageWithRelations[]
): Promise<DraftReplyResult> {
    // Read at call-time (not module load) so dotenv's load order can't bite us.
    const mode = process.env.AI_DRAFT_MODE ?? 'mock';

    if (mode === 'live') {
        return generateGeminiDraftReply(ticket, thread);
    }
    return generateMockDraftReply(ticket, thread);
}