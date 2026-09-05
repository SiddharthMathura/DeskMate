import type {
    AuthUser,
    MeResponse,
    LoginInput,
    Ticket,
    CreateTicketInput,
    PatchTicketInput,
    ListTicketsFilters,
    Message,
    CreateMessageInput,
} from '../types';

const API_BASE = '/api';

export class ApiError extends Error {
    status: number;
    details?: unknown;
    constructor(status: number, message: string, details?: unknown) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.details = details;
    }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        credentials: 'include', // sends the session cookie
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
    });

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = body.error ?? body.message ?? `Request failed: ${res.status}`;
        throw new ApiError(res.status, msg, body.details);
    }

    // Handle 204 No Content (e.g. logout) with no body to parse
    if (res.status === 204) return undefined as T;

    return res.json();
}

function buildQuery(params: Record<string, string | undefined>): string {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
            searchParams.append(key, String(val));
        }
    });
    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
}

export const apiClient = {
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
    patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
};

// Auth
export const authApi = {
    login: (input: LoginInput) => apiClient.post<AuthUser>('/auth/login', input),
    logout: () => apiClient.post<void>('/auth/logout'),
    me: () => apiClient.get<MeResponse>('/auth/me'),
};

// Tickets
export const ticketsApi = {
    list: async (filters: ListTicketsFilters = {}) => {
        const { tickets } = await apiClient.get<{ tickets: Ticket[] }>(
            `/tickets${buildQuery(filters as Record<string, string | undefined>)}`
        );
        return tickets;
    },
    get: async (id: string) => {
        const { ticket } = await apiClient.get<{ ticket: Ticket }>(`/tickets/${id}`);
        return ticket;
    },
    create: async (data: CreateTicketInput) => {
        const { ticket } = await apiClient.post<{ ticket: Ticket }>('/tickets', data);
        return ticket;
    },
    patch: async (id: string, data: PatchTicketInput) => {
        const { ticket } = await apiClient.patch<{ ticket: Ticket }>(`/tickets/${id}`, data);
        return ticket;
    },
    claim: async (id: string) => {
        const { ticket } = await apiClient.post<{ ticket: Ticket }>(`/tickets/${id}/claim`);
        return ticket;
    },
};

// Messages
export const messagesApi = {
    list: async (ticketId: string) => {
        const { messages } = await apiClient.get<{ messages: Message[] }>(`/tickets/${ticketId}/messages`);
        return messages;
    },
    create: async (ticketId: string, data: CreateMessageInput) => {
        const { message } = await apiClient.post<{ message: Message }>(`/tickets/${ticketId}/messages`, data);
        return message;
    },
};