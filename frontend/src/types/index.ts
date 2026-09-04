export interface HealthCheckResponse {
    status: string;
    timestamp?: string;
}

// Enums
export type UserRole = 'agent' | 'admin';
export type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';
export type MessageSenderType = 'customer' | 'agent' | 'ai_draft';

// Auth
export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: UserRole;
}

export interface MeResponse extends AuthUser {
    createdAt: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

// Shared relation
export interface UserSummary {
    id: string;
    name: string;
    email: string;
}

export interface CustomerSummary {
    id: string;
    name: string;
    email: string;
}

// Tickets
export interface Ticket {
    id: string;
    customerId: string;
    assignedAgentId: string | null;
    subject: string;
    status: TicketStatus;
    priority: TicketPriority;
    createdAt: string;
    updatedAt: string;
    customer: CustomerSummary;
    assignedAgent: UserSummary | null;
}

export interface CreateTicketInput {
    customerId: string;
    subject: string;
    priority?: TicketPriority;
}

export interface PatchTicketInput {
    status?: TicketStatus;
    priority?: TicketPriority;
    assignedAgentId?: string | null;
}

export interface ListTicketsFilters {
    status?: TicketStatus;
    // "me" | "unassigned" | a real agent uuid — resolved server-side
    assignedAgentId?: string;
}

// Messages
export interface Message {
    id: string;
    ticketId: string;
    senderType: MessageSenderType;
    senderId: string | null;
    body: string;
    isDraft: boolean;
    createdAt: string;
    agent: UserSummary | null;
}

export interface CreateMessageInput {
    body: string;
}