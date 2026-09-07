import { prisma } from '../db/prisma';
import { NotFoundError, ConflictError, ValidationError, ForbiddenError } from '../utils/http-error';
import type { CreateTicketInput, PatchTicketInput } from '../schemas/ticket.schema';
import type { TicketStatus } from '@prisma/client';
import type { SessionPayload } from '../auth/session.service';

const ticketWithRelations = {
    customer: { select: { id: true, name: true, email: true } },
    assignedAgent: { select: { id: true, name: true, email: true } },
};

interface ListFilters {
    status?: string;
    priority?: string;
    assignedAgentId?: string; // already resolved from "me" to a real id by the route
    sortBy?: 'createdAt' | 'priority';
    sortOrder?: 'asc' | 'desc';
}

// Allowed status transitions
const ALLOWED_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
    open: ['pending', 'resolved'],
    pending: ['open', 'resolved'],
    resolved: ['pending', 'open', 'closed'],
    closed: ['open'],
};

function assertValidTransition(from: TicketStatus, to: TicketStatus) {
    if (from === to) return; // no-op, not a transition
    if (!ALLOWED_TRANSITIONS[from].includes(to)) {
        throw new ValidationError(`Cannot transition ticket from "${from}" to "${to}"`);
    }
}

export async function listTickets(filters: ListFilters) {
    const where: Record<string, unknown> = {};

    if (filters.status) {
        where.status = filters.status;
    }

    if (filters.priority) {
        where.priority = filters.priority;
    }

    if (filters.assignedAgentId === 'unassigned') {
        where.assignedAgentId = null;
    } else if (filters.assignedAgentId) {
        where.assignedAgentId = filters.assignedAgentId;
    }

    const sortOrder = filters.sortOrder ?? 'desc';

    // Built explicitly (rather than a computed-key object literal) so the
    // shape Prisma receives is unambiguous regardless of TS inference quirks.
    const orderBy =
        filters.sortBy === 'priority'
            ? { priority: sortOrder }
            : { createdAt: sortOrder };

    return prisma.ticket.findMany({
        where,
        include: ticketWithRelations,
        orderBy,
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

export async function updateTicket(id: string, data: PatchTicketInput, actingUser: SessionPayload) {
    const ticket = await getTicketById(id); // throws NotFoundError if missing

    if (data.status !== undefined) {
        assertValidTransition(ticket.status, data.status);
    }

    if (data.assignedAgentId !== undefined) {
        if (data.assignedAgentId === null) {
            // Unassigning: allowed if you're the current assignee, or admin.
            // An unrelated agent may not reach in and drop someone else's ticket.
            const isCurrentAssignee = ticket.assignedAgentId === actingUser.userId;
            if (!isCurrentAssignee && actingUser.role !== 'admin') {
                throw new ForbiddenError('Only the assigned agent or an admin can unassign this ticket');
            }
        } else {
            // Assigning: self-assign is open to any agent. Assigning to
            // someone ELSE requires admin.
            if (data.assignedAgentId !== actingUser.userId && actingUser.role !== 'admin') {
                throw new ForbiddenError('Only admins can assign a ticket to another agent');
            }

            const agent = await prisma.user.findUnique({ where: { id: data.assignedAgentId } });
            if (!agent) {
                throw new NotFoundError('Agent not found');
            }
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

    if (ticket.status === 'closed') {
        throw new ValidationError('Cannot claim a closed ticket; reopen it first');
    }

    if (ticket.assignedAgentId && ticket.assignedAgentId !== agentId) {
        throw new ConflictError('Ticket is already claimed by another agent');
    }

    return prisma.ticket.update({
        where: { id },
        data: { assignedAgentId: agentId },
        include: ticketWithRelations,
    });
}