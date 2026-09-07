import type * as ticketService from '../ticket.service';
import type * as messageService from '../message.service';
import { generateMockDraftReply } from './mock';

export type TicketWithRelations = Awaited<ReturnType<typeof ticketService.getTicketById>>;
export type MessageWithRelations = Awaited<ReturnType<typeof messageService.listMessagesByTicketId>>[number];

export interface DraftReplyResult {
    draftText: string;
    modelUsed: string;
    // What was (or, for the mock, would be) sent to the model. Persisted to
    // ai_draft_requests.prompt_snapshot. The real Claude implementation
    // returns its actual constructed prompt here — the call site
    // that logs this doesn't change. (later)
    promptSnapshot: string;
}

// Real Claude API (later)

export async function generateDraftReply(
    ticket: TicketWithRelations,
    thread: MessageWithRelations[]
): Promise<DraftReplyResult> {
    return generateMockDraftReply(ticket, thread);
}