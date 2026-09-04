import { prisma } from '../db/prisma';
import * as ticketService from './ticket.service';
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
    await ticketService.getTicketById(ticketId); // throws NotFoundError if ticket missing

    return prisma.message.create({
        data: {
            ticketId,
            senderType: 'agent',
            senderId: agentId,
            body: data.body,
            isDraft: false,
        },
        include: messageWithRelations,
    });
}