export type AssigneeFilterValue = 'all' | 'me' | 'unassigned';

const OPTIONS: { value: AssigneeFilterValue; label: string }[] = [
    { value: 'all', label: 'All tickets' },
    { value: 'me', label: 'Assigned to me' },
    { value: 'unassigned', label: 'Unassigned' },
];

interface AssigneeFilterProps {
    value: AssigneeFilterValue;
    onChange: (value: AssigneeFilterValue) => void;
}

export function AssigneeFilter({ value, onChange }: AssigneeFilterProps) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value as AssigneeFilterValue)}
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