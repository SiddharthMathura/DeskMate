import { useState, type MouseEvent } from 'react';
import type { Ticket } from '../types';
import { StatusBadge } from './ui/StatusBadge';
import { PriorityBadge } from './ui/PriorityBadge';

interface TicketListProps {
    tickets: Ticket[];
    onSelect?: (ticket: Ticket) => void;
    onClaim?: (ticket: Ticket) => Promise<void> | void;
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
    });
}

export function TicketList({ tickets, onSelect, onClaim }: TicketListProps) {
    const [claimingIds, setClaimingIds] = useState<Set<string>>(new Set());

    async function handleClaim(e: MouseEvent<HTMLButtonElement>, ticket: Ticket) {
        e.stopPropagation(); // don't trigger the row's onSelect navigation
        if (!onClaim || claimingIds.has(ticket.id)) return;

        setClaimingIds((prev) => new Set(prev).add(ticket.id));
        try {
            await onClaim(ticket);
        } finally {
            setClaimingIds((prev) => {
                const next = new Set(prev);
                next.delete(ticket.id);
                return next;
            });
        }
    }

    if (tickets.length === 0) {
        return (
            <div className="rounded-lg border border-line bg-surface p-8 text-center">
                <p className="text-sm text-ink-soft">No tickets match this filter.</p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-lg border border-line bg-surface">
            <table className="w-full text-left text-sm">
                <thead className="border-b border-line bg-paper text-xs uppercase tracking-wide text-ink-soft">
                    <tr>
                        <th className="px-4 py-3 font-medium">Subject</th>
                        <th className="px-4 py-3 font-medium">Customer</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Priority</th>
                        <th className="px-4 py-3 font-medium">Assignee</th>
                        <th className="px-4 py-3 font-medium">Updated</th>
                        <th className="px-4 py-3 font-medium" />
                    </tr>
                </thead>
                <tbody className="divide-y divide-line">
                    {tickets.map((ticket) => {
                        const canClaim = Boolean(onClaim) && ticket.assignedAgent === null && ticket.status !== 'closed';
                        const isClaiming = claimingIds.has(ticket.id);

                        return (
                            <tr
                                key={ticket.id}
                                onClick={() => onSelect?.(ticket)}
                                className={onSelect ? 'cursor-pointer transition hover:bg-paper' : ''}
                            >
                                <td className="px-4 py-3 font-medium text-ink">{ticket.subject}</td>
                                <td className="px-4 py-3 text-ink-soft">{ticket.customer.name}</td>
                                <td className="px-4 py-3">
                                    <StatusBadge status={ticket.status} />
                                </td>
                                <td className="px-4 py-3">
                                    <PriorityBadge priority={ticket.priority} />
                                </td>
                                <td className="px-4 py-3 text-ink-soft">
                                    {ticket.assignedAgent?.name ?? '—'}
                                </td>
                                <td className="px-4 py-3 text-ink-soft">{formatDate(ticket.updatedAt)}</td>
                                <td className="px-4 py-3">
                                    {canClaim && (
                                        <button
                                            onClick={(e) => void handleClaim(e, ticket)}
                                            disabled={isClaiming}
                                            className="rounded-md border border-brand px-2.5 py-1 text-xs font-medium text-brand transition hover:bg-brand hover:text-white disabled:opacity-50"
                                        >
                                            {isClaiming ? 'Claiming…' : 'Claim'}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}