import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';

interface LocationState {
    from?: string;
}

export function LoginPage() {
    const { login, status } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false); // State for show/hide password
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    if (status === 'authenticated') {
        const redirectTo = (location.state as LocationState | null)?.from ?? '/inbox';
        return <Navigate to={redirectTo} replace />;
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await login({ email, password });
            const redirectTo = (location.state as LocationState | null)?.from ?? '/inbox';
            navigate(redirectTo, { replace: true });
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.status === 401 ? 'Invalid email or password.' : err.message);
            } else {
                setError('Something went wrong. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="flex min-h-screen bg-paper">
            <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-brand p-12 lg:flex">
                <span className="font-display text-2xl font-bold text-white">DeskMate</span>

                <div className="max-w-sm">
                    <p className="font-display text-3xl font-semibold leading-snug text-white">
                        Every ticket, answered faster.
                    </p>
                    <p className="mt-4 text-sm text-brand-soft">
                        Claim conversations, draft replies with AI assistance, and keep your team's inbox at zero.
                    </p>
                </div>

                <svg
                    className="pointer-events-none absolute -bottom-16 -right-16 h-72 w-72 text-brand-dark opacity-50"
                    viewBox="0 0 200 200"
                    fill="none"
                    aria-hidden="true"
                >
                    <rect x="20" y="30" width="140" height="30" rx="6" stroke="currentColor" strokeWidth="2" />
                    <rect x="40" y="80" width="140" height="30" rx="6" stroke="currentColor" strokeWidth="2" />
                    <rect x="20" y="130" width="100" height="30" rx="6" stroke="currentColor" strokeWidth="2" />
                </svg>
            </div>

            <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
                <div className="w-full max-w-sm">
                    <div className="mb-8 lg:hidden">
                        <span className="font-display text-2xl font-bold text-brand">DeskMate</span>
                    </div>

                    <h1 className="text-xl font-semibold text-ink">Sign in</h1>
                    <p className="mt-1 text-sm text-ink-soft">Use your agent account to access the inbox.</p>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-ink">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-ink">
                                Password
                            </label>
                            <div className="relative mt-1">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-md border border-line bg-surface pl-3 pr-10 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                                />
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-ink-soft hover:text-ink focus:outline-none"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? (
                                        // Eye Off Icon
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                        </svg>
                                    ) : (
                                        // Eye Icon
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {error && <p className="text-sm text-priority-urgent">{error}</p>}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full rounded-md bg-brand px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting ? 'Signing in…' : 'Sign in'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}