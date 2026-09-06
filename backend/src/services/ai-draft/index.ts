import type * as ticketService from '../ticket.service';
import type * as messageService from '../message.service';
import { generateMockDraftReply } from './mock';

export type TicketWithRelations = Awaited<ReturnType<typeof ticketService.getTicketById>>;
export type MessageWithRelations = Awaited<ReturnType<typeof messageService.listMessagesByTicketId>>[number];

export interface DraftReplyResult {
    draftText: string;
    modelUsed: string;
}

// Real Claude API (later)

export async function generateDraftReply(
    ticket: TicketWithRelations,
    thread: MessageWithRelations[]
): Promise<DraftReplyResult> {
    return generateMockDraftReply(ticket, thread);
}