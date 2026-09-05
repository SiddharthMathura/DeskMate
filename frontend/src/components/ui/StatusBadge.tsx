import type { TicketStatus } from '../../types';

const STATUS_LABELS: Record<TicketStatus, string> = {
    open: 'Open',
    pending: 'Pending',
    resolved: 'Resolved',
    closed: 'Closed',
};

const STATUS_CLASSES: Record<TicketStatus, string> = {
    open: 'bg-status-open/10 text-status-open border-status-open/30',
    pending: 'bg-status-pending/10 text-status-pending border-status-pending/30',
    resolved: 'bg-status-resolved/10 text-status-resolved border-status-resolved/30',
    closed: 'bg-status-closed/10 text-status-closed border-status-closed/30',
};

export function StatusBadge({ status }: { status: TicketStatus }) {
    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]}`}
        >
            {STATUS_LABELS[status]}
        </span>
    );
}