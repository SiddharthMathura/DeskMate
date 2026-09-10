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
const DEFAULT_TIMEOUT_MS = 15000;

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

interface RequestOptions extends RequestInit {
    timeoutMs?: number;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { timeoutMs = DEFAULT_TIMEOUT_MS, signal: externalSignal, ...fetchOptions } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let onExternalAbort: (() => void) | undefined;
    if (externalSignal) {
        if (externalSignal.aborted) {
            controller.abort();
        } else {
            onExternalAbort = () => controller.abort();
            externalSignal.addEventListener('abort', onExternalAbort);
        }
    }

    let res: Response;
    try {
        res = await fetch(`${API_BASE}${path}`, {
            credentials: 'include', // sends the session cookie
            headers: { 'Content-Type': 'application/json', ...fetchOptions.headers },
            signal: controller.signal,
            ...fetchOptions,
        });
    } catch (err) {
        // status 0 = we never got a real HTTP response (client-side outcome,
        // not a server error). Figure out which of the three client-side
        // causes this was: user cancelled, we timed out, or network failed.
        if (err instanceof Error && err.name === 'AbortError') {
            if (externalSignal?.aborted) {
                throw new ApiError(0, 'Cancelled.');
            }
            throw new ApiError(0, 'Request timed out. Please try again.');
        }
        throw new ApiError(0, 'Could not reach the server. Check your connection.');
    } finally {
        clearTimeout(timeoutId);
        if (externalSignal && onExternalAbort) {
            externalSignal.removeEventListener('abort', onExternalAbort);
        }
    }

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

interface CallOptions {
    timeoutMs?: number;
    signal?: AbortSignal;
}

export const apiClient = {
    get: <T>(path: string, opts?: CallOptions) => request<T>(path, opts),
    post: <T>(path: string, body?: unknown, opts?: CallOptions) => request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined, ...opts }),
    patch: <T>(path: string, body?: unknown, opts?: CallOptions) => request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined, ...opts }),
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

// AI Draft
export interface DraftReply {
    draftText: string;
    modelUsed: string;
}

// Matches backend ai_draft_requests
// A failed attempt is represented as a normal row whose responseSnapshot
// starts with "[FAILED]
export interface DraftHistoryEntry {
    id: string;
    ticketId: string;
    promptSnapshot: string;
    responseSnapshot: string;
    modelUsed: string;
    createdAt: string;
}

// real latency observed ranging from ~1s to 45s+ on
// Gemini's free tier. This is a safety net so a request can never hang
// forever; the agent-facing Cancel button is the primary control.
const DRAFT_TIMEOUT_MS = 60000;

export const draftApi = {
    generate: async (ticketId: string, signal?: AbortSignal) => {
        const { draft } = await apiClient.post<{ draft: DraftReply }>(`/tickets/${ticketId}/draft`,
            undefined,
            { timeoutMs: DRAFT_TIMEOUT_MS, signal }
        );
        return draft;
    },
    history: async (ticketId: string) => {
        const { draftRequests } = await apiClient.get<{ draftRequests: DraftHistoryEntry[] }>(`/tickets/${ticketId}/draft/history`
        );
        return draftRequests;
    },
};