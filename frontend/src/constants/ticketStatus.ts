import type { TicketStatus } from '../types';

// Mirrors backend/src/services/ticket.service.ts ALLOWED_TRANSITIONS.
// Have keep these two in sync if the backend graph ever changes.
export const ALLOWED_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
    open: ['pending', 'resolved'],
    pending: ['open', 'resolved'],
    resolved: ['pending', 'open', 'closed'],
    closed: ['open'],
};

export const STATUS_LABELS: Record<TicketStatus, string> = {
    open: 'Open',
    pending: 'Pending',
    resolved: 'Resolved',
    closed: 'Closed',
};