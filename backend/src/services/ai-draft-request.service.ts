import { prisma } from '../db/prisma';

export async function logDraftRequest(
    ticketId: string,
    promptSnapshot: string,
    responseSnapshot: string,
    modelUsed: string
) {
    return prisma.aiDraftRequest.create({
        data: {
            ticketId,
            promptSnapshot,
            responseSnapshot,
            modelUsed,
        },
    });
}