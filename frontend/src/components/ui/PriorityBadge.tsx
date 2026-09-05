import type { TicketPriority } from '../../types';

const PRIORITY_LABELS: Record<TicketPriority, string> = {
    low: 'Low',
    normal: 'Normal',
    high: 'High',
    urgent: 'Urgent',
};

const PRIORITY_CLASSES: Record<TicketPriority, string> = {
    low: 'bg-priority-low/10 text-priority-low border-priority-low/30',
    normal: 'bg-priority-normal/10 text-priority-normal border-priority-normal/30',
    high: 'bg-priority-high/10 text-priority-high border-priority-high/30',
    urgent: 'bg-priority-urgent/10 text-priority-urgent border-priority-urgent/30',
};

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${PRIORITY_CLASSES[priority]}`}
        >
            {PRIORITY_LABELS[priority]}
        </span>
    );
}