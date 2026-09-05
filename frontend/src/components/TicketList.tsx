import type { Ticket } from '../types';
import { StatusBadge } from './ui/StatusBadge';
import { PriorityBadge } from './ui/PriorityBadge';

interface TicketListProps {
    tickets: Ticket[];
    onSelect?: (ticket: Ticket) => void;
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
    });
}

export function TicketList({ tickets, onSelect }: TicketListProps) {
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
                    </tr>
                </thead>
                <tbody className="divide-y divide-line">
                    {tickets.map((ticket) => (
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
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}