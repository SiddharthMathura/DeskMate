import type { TicketWithRelations, MessageWithRelations, DraftReplyResult } from './index';

export function generateMockDraftReply(
    ticket: TicketWithRelations,
    thread: MessageWithRelations[]
): DraftReplyResult {
    const lastCustomerMessage = [...thread].reverse().find((m) => m.senderType === 'customer');
    const customerName = ticket.customer.name;
    const subject = ticket.subject;

    const draftText = lastCustomerMessage
        ? `Hi ${customerName},\n\nThanks for reaching out about "${subject}". You mentioned:\n\n"${lastCustomerMessage.body}"\n\nWe're looking into this and will follow up shortly with next steps.\n\nBest,\nThe Support Team`
        : `Hi ${customerName},\n\nThanks for reaching out about "${subject}". We're looking into this and will follow up shortly with next steps.\n\nBest,\nThe Support Team`;

    return {
        draftText,
        modelUsed: 'mock',
    };
}