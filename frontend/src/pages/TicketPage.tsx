import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ticketsApi, messagesApi, ApiError } from '../api/client';
import type { Ticket, Message, TicketStatus } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PriorityBadge } from '../components/ui/PriorityBadge';
import { MessageThread } from '../components/MessageThread';
import { DraftReplyPanel } from '../components/DraftReplyPanel';
import { StatusTransitionControls } from '../components/StatusTransitionControls';

export function TicketPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusUpdating, setStatusUpdating] = useState(false);
    const [statusError, setStatusError] = useState<string | null>(null);
    const [claiming, setClaiming] = useState(false);
    const [claimError, setClaimError] = useState<string | null>(null);

    const loadTicket = useCallback(async (ticketId: string) => {
        setLoading(true);
        setError(null);
        try {
            const [ticketResult, messagesResult] = await Promise.all([
                ticketsApi.get(ticketId),
                messagesApi.list(ticketId),
            ]);
            setTicket(ticketResult);
            setMessages(messagesResult);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to load ticket.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (id) void loadTicket(id);
    }, [id, loadTicket]);

    async function handleSend(body: string) {
        if (!id) return;
        const newMessage = await messagesApi.create(id, { body });
        setMessages((prev) => [...prev, newMessage]);
    }

    async function handleStatusChange(next: TicketStatus) {
        if (!ticket) return;
        setStatusUpdating(true);
        setStatusError(null);
        try {
            const updated = await ticketsApi.patch(ticket.id, { status: next });
            setTicket(updated);
        } catch (err) {
            setStatusError(err instanceof ApiError ? err.message : 'Failed to update status.');
        } finally {
            setStatusUpdating(false);
        }
    }

    async function handleClaim() {
        if (!ticket) return;
        setClaiming(true);
        setClaimError(null);
        try {
            await ticketsApi.claim(ticket.id);
            // Re-fetch rather than trust the claim response shape
            const refreshed = await ticketsApi.get(ticket.id);
            setTicket(refreshed);
        } catch (err) {
            if (err instanceof ApiError && err.status === 409) {
                setClaimError('This ticket was just claimed by someone else.');
                // Reflect the real current assignee rather than leaving stale state.
                try {
                    const refreshed = await ticketsApi.get(ticket.id);
                    setTicket(refreshed);
                } catch {
                    // If this secondary fetch fails, the claimError message above
                    // still stands
                }
            } else {
                setClaimError(err instanceof ApiError ? err.message : 'Failed to claim ticket.');
            }
        } finally {
            setClaiming(false);
        }
    }

    const canClaim = Boolean(ticket) && ticket!.assignedAgent === null && ticket!.status !== 'closed';
    const isMine = Boolean(ticket?.assignedAgent && user && ticket!.assignedAgent!.id === user.id);

    return (
        <div className="min-h-screen bg-paper">
            <header className="border-b border-line bg-brand px-6 py-4">
                <button
                    onClick={() => navigate('/inbox')}
                    className="text-sm text-brand-soft transition hover:text-white"
                >
                    ← Back to Inbox
                </button>
            </header>

            <main className="mx-auto max-w-3xl p-6">
                {loading && (
                    <div className="rounded-lg border border-line bg-surface p-8 text-center">
                        <p className="text-sm text-ink-soft">Loading ticket…</p>
                    </div>
                )}

                {error && (
                    <div className="rounded-md border border-status-pending/30 bg-status-pending/10 px-4 py-3 text-sm text-status-pending">
                        {error}
                    </div>
                )}

                {!loading && !error && ticket && (
                    <>
                        <div className="mb-4">
                            <h1 className="font-display text-xl font-semibold text-ink">{ticket.subject}</h1>
                            <div className="mt-2 flex items-center gap-3">
                                <StatusBadge status={ticket.status} />
                                <PriorityBadge priority={ticket.priority} />
                                <span className="text-sm text-ink-soft">
                                    {ticket.customer.name} · {ticket.customer.email}
                                </span>
                            </div>

                            <div className="mt-1 flex items-center gap-3">
                                <p className="text-sm text-ink-soft">
                                    {ticket.assignedAgent === null
                                        ? 'Unassigned'
                                        : isMine
                                          ? 'Assigned to you'
                                          : `Assigned to ${ticket.assignedAgent.name}`}
                                </p>

                                {canClaim && (
                                    <button
                                        onClick={() => void handleClaim()}
                                        disabled={claiming}
                                        className="rounded-md border border-brand px-2.5 py-1 text-xs font-medium text-brand transition hover:bg-brand hover:text-white disabled:opacity-50"
                                    >
                                        {claiming ? 'Claiming…' : 'Claim'}
                                    </button>
                                )}
                            </div>

                            {claimError && (
                                <div className="mt-2 rounded-md border border-status-pending/30 bg-status-pending/10 px-3 py-2 text-sm text-status-pending">
                                    {claimError}
                                </div>
                            )}

                            {statusError && (
                                <div className="mt-2 rounded-md border border-status-pending/30 bg-status-pending/10 px-3 py-2 text-sm text-status-pending">
                                    {statusError}
                                </div>
                            )}

                            <div className="mt-3">
                                <StatusTransitionControls
                                    status={ticket.status}
                                    onTransition={handleStatusChange}
                                    disabled={statusUpdating}
                                />
                            </div>
                        </div>

                        <MessageThread messages={messages} onSend={handleSend} />
                        <DraftReplyPanel ticketId={ticket.id} onSend={handleSend} />
                    </>
                )}
            </main>
        </div>
    );
}