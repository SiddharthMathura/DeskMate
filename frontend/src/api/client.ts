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
    list: (filters: ListTicketsFilters = {}) => apiClient.get<Ticket[]>(`/tickets${buildQuery(filters as Record<string, string | undefined>)}`),
    get: (id: string) => apiClient.get<Ticket>(`/tickets/${id}`),
    create: (data: CreateTicketInput) => apiClient.post<Ticket>('/tickets', data),
    patch: (id: string, data: PatchTicketInput) => apiClient.patch<Ticket>(`/tickets/${id}`, data),
    claim: (id: string) => apiClient.post<Ticket>(`/tickets/${id}/claim`),
};

// Messages
export const messagesApi = {
    list: (ticketId: string) => apiClient.get<Message[]>(`/tickets/${ticketId}/messages`),
    create: (ticketId: string, data: CreateMessageInput) => apiClient.post<Message>(`/tickets/${ticketId}/messages`, data),
};