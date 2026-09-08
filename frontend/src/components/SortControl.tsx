export type SortValue = 'newest' | 'oldest' | 'priority-desc' | 'priority-asc';

const OPTIONS: { value: SortValue; label: string }[] = [
    { value: 'newest', label: 'Newest first' },
    { value: 'oldest', label: 'Oldest first' },
    { value: 'priority-desc', label: 'Priority: high to low' },
    { value: 'priority-asc', label: 'Priority: low to high' },
];

interface SortControlProps {
    value: SortValue;
    onChange: (value: SortValue) => void;
}

export function SortControl({ value, onChange }: SortControlProps) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value as SortValue)}
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

// Maps the friendly UI value to the sortBy/sortOrder query params the
// way backend expects. Relies on the Postgres enum declaration
// order (low<normal<high<urgent), same convention as the backend.
export function sortValueToParams(
    sort: SortValue
): { sortBy: 'createdAt' | 'priority'; sortOrder: 'asc' | 'desc' } {
    switch (sort) {
        case 'newest':
            return { sortBy: 'createdAt', sortOrder: 'desc' };
        case 'oldest':
            return { sortBy: 'createdAt', sortOrder: 'asc' };
        case 'priority-desc':
            return { sortBy: 'priority', sortOrder: 'desc' };
        case 'priority-asc':
            return { sortBy: 'priority', sortOrder: 'asc' };
    }
}