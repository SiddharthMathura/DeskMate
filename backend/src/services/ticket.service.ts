import { prisma } from '../db/prisma';
import { NotFoundError, ConflictError } from '../utils/http-error';
import type { CreateTicketInput, PatchTicketInput } from '../schemas/ticket.schema';

const ticketWithRelations = {
    customer: { select: { id: true, name: true, email: true } },
    assignedAgent: { select: { id: true, name: true, email: true } },
};

interface ListFilters {
    status?: string;
    assignedAgentId?: string; // already resolved from "me" to a real id by the route
}

export async function listTickets(filters: ListFilters) {
    const where: Record<string, unknown> = {};

    if (filters.status) {
        where.status = filters.status;
    }

    if (filters.assignedAgentId === 'unassigned') {
        where.assignedAgentId = null;
    } else if (filters.assignedAgentId) {
        where.assignedAgentId = filters.assignedAgentId;
    }

    return prisma.ticket.findMany({
        where,
        include: ticketWithRelations,
        orderBy: { createdAt: 'desc' },
    });
}

export async function getTicketById(id: string) {
    const ticket = await prisma.ticket.findUnique({
        where: { id },
        include: ticketWithRelations,
    });

    if (!ticket) {
        throw new NotFoundError('Ticket not found');
    }

    return ticket;
}

export async function createTicket(data: CreateTicketInput) {
    const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
    if (!customer) {
        throw new NotFoundError('Customer not found');
    }

    return prisma.ticket.create({
        data: {
            customerId: data.customerId,
            subject: data.subject,
            priority: data.priority,
            status: 'open',
        },
        include: ticketWithRelations,
    });
}

export async function updateTicket(id: string, data: PatchTicketInput) {
    await getTicketById(id); // throws NotFoundError if missing

    if (data.assignedAgentId) {
        const agent = await prisma.user.findUnique({ where: { id: data.assignedAgentId } });
        if (!agent) {
            throw new NotFoundError('Agent not found');
        }
    }

    return prisma.ticket.update({
        where: { id },
        data: {
            ...(data.status !== undefined && { status: data.status }),
            ...(data.priority !== undefined && { priority: data.priority }),
            ...(data.assignedAgentId !== undefined && { assignedAgentId: data.assignedAgentId }),
        },
        include: ticketWithRelations,
    });
}

export async function claimTicket(id: string, agentId: string) {
    const ticket = await getTicketById(id);

    if (ticket.assignedAgentId && ticket.assignedAgentId !== agentId) {
        throw new ConflictError('Ticket is already claimed by another agent');
    }

    return prisma.ticket.update({
        where: { id },
            data: { assignedAgentId: agentId },
            include: ticketWithRelations,
    });
}