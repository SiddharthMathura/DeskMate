import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function InboxPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const initials = user?.name
        ? user.name
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()
        : '?';

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

            <main className="p-6">
                <div className="rounded-lg border border-line bg-surface p-8 text-center">
                    <p className="text-sm text-ink-soft">Ticket inbox</p>
                </div>
            </main>
        </div>
    );
}