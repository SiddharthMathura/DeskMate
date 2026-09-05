import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ticketsApi, ApiError } from '../api/client';
import type { Ticket } from '../types';
import { TicketList } from '../components/TicketList';
import { AssigneeFilter, type AssigneeFilterValue } from '../components/AssignessFilter';

export function InboxPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [assigneeFilter, setAssigneeFilter] = useState<AssigneeFilterValue>('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const initials = user?.name
        ? user.name
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()
        : '?';

    const loadTickets = useCallback(async (filter: AssigneeFilterValue) => {
        setLoading(true);
        setError(null);
        try {
            const result = await ticketsApi.list(
                filter === 'all' ? {} : { assignedAgentId: filter }
            );
            setTickets(result);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to load tickets.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadTickets(assigneeFilter);
    }, [assigneeFilter, loadTickets]);

    async function handleLogout() {
        await logout();
        navigate('/login', { replace: true });
    }

    return (
        <div className="min-h-screen bg-paper">
            <header className="flex items-center justify-between border-b border-line bg-brand px-6 py-4">
                <span className="font-display text-lg font-bold text-white">DeskMate</span>
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-dark text-xs font-semibold text-white">
                        {initials}
                    </div>
                    {user && <span className="text-sm text-brand-soft">{user.name}</span>}
                    <button
                        onClick={() => void handleLogout()}
                        className="rounded-md border border-white/30 px-3 py-1.5 text-sm text-white transition hover:bg-brand-dark"
                    >
                        Log out
                    </button>
                </div>
            </header>

            <main className="mx-auto max-w-5xl p-6">
                <div className="mb-4 flex items-center justify-between">
                    <h1 className="font-display text-xl font-semibold text-ink">Inbox</h1>
                    <AssigneeFilter value={assigneeFilter} onChange={setAssigneeFilter} />
                </div>

                {error && (
                    <div className="mb-4 rounded-md border border-status-pending/30 bg-status-pending/10 px-4 py-3 text-sm text-status-pending">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="rounded-lg border border-line bg-surface p-8 text-center">
                        <p className="text-sm text-ink-soft">Loading tickets…</p>
                    </div>
                ) : (
                    <TicketList tickets={tickets} onSelect={(ticket) => navigate(`/tickets/${ticket.id}`)} />
                )}
            </main>
        </div>
    );
}