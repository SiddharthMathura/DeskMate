import type { TicketStatus } from '../types';
import { ALLOWED_TRANSITIONS, STATUS_LABELS } from '../constants/ticketStatus';

interface StatusTransitionControlsProps {
    status: TicketStatus;
    onTransition: (next: TicketStatus) => void | Promise<void>;
    disabled?: boolean;
}

export function StatusTransitionControls({ status, onTransition, disabled }: StatusTransitionControlsProps) {
    const nextStatuses = ALLOWED_TRANSITIONS[status];

    if (nextStatuses.length === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-ink-soft">Move to:</span>
            {nextStatuses.map((next) => (
                <button
                    key={next}
                    onClick={() => void onTransition(next)}
                    disabled={disabled}
                    className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink transition hover:border-brand hover:text-brand disabled:opacity-50"
                >
                    {STATUS_LABELS[next]}
                </button>
            ))}
        </div>
    );
}