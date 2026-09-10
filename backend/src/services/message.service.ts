import { prisma } from '../db/prisma';
import * as ticketService from './ticket.service';
import { ValidationError } from '../utils/http-error';
import type { CreateMessageInput } from '../schemas/message.schema';

const messageWithRelations = {
    agent: { select: { id: true, name: true, email: true } },
};

export async function listMessagesByTicketId(ticketId: string) {
    await ticketService.getTicketById(ticketId); // throws NotFoundError if ticket missing

    return prisma.message.findMany({
        where: { ticketId },
        include: messageWithRelations,
        orderBy: { createdAt: 'asc' },
    });
}

export async function createMessage(ticketId: string, agentId: string, data: CreateMessageInput) {
    const ticket = await ticketService.getTicketById(ticketId); // throws NotFoundError if ticket missing

    if (ticket.status === 'closed') {
        throw new ValidationError('Cannot reply to a closed ticket; reopen it first');
    }

    // Auto-claim on reply: any agent may reply to any open/pending/resolved
    // ticket (shared-inbox model), but if it's currently unassigned, sending
    // a reply also claims it for the replying agent, same effect as hitting
    // "Claim" first, just automatic. Never reassigns a ticket someone else
    // already owns.
    const shouldAutoClaim = ticket.assignedAgentId === null;

    const [message] = await prisma.$transaction([
        prisma.message.create({
            data: {
                ticketId,
                senderType: 'agent',
                senderId: agentId,
                body: data.body,
                isDraft: false,
            },
            include: messageWithRelations,
        }),
        ...(shouldAutoClaim
            ? [
                  prisma.ticket.update({
                      where: { id: ticketId },
                      data: { assignedAgentId: agentId },
                  }),
              ]
            : []),
    ]);

    return message;
}