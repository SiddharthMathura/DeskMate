import type { TicketPriority } from '../types';

export type PriorityFilterValue = 'all' | TicketPriority;

const OPTIONS: { value: PriorityFilterValue; label: string }[] = [
    { value: 'all', label: 'All priorities' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'high', label: 'High' },
    { value: 'normal', label: 'Normal' },
    { value: 'low', label: 'Low' },
];

interface PriorityFilterProps {
    value: PriorityFilterValue;
    onChange: (value: PriorityFilterValue) => void;
}

export function PriorityFilter({ value, onChange }: PriorityFilterProps) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value as PriorityFilterValue)}
            className="rounded-md border border-line bg-surface px-3 py-1.5 text-sm text-ink shadow-sm focus:border-brand focus:outline-none"
        >
            {OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
}