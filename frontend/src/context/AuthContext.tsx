import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    type ReactNode,
} from 'react';
import { authApi, ApiError } from '../api/client';
import type { AuthUser, LoginInput } from '../types';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
    user: AuthUser | null;
    status: AuthStatus;
    login: (input: LoginInput) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [status, setStatus] = useState<AuthStatus>('loading');

    // Check whether a valid session cookie already exists so we
    // don't flash a login form at an already-authenticated agent.
    useEffect(() => {
        let cancelled = false;

        authApi
            .me()
            .then((me) => {
                if (cancelled) return;
                setUser(me);
                setStatus('authenticated');
            })
            .catch((err) => {
                if (cancelled) return;
                setUser(null);
                setStatus('unauthenticated');

                if (!(err instanceof ApiError) || err.status !== 401) {
                    console.error('Failed to check session:', err);
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const login = useCallback(async (input: LoginInput) => {
        const loggedInUser = await authApi.login(input);
        setUser(loggedInUser);
        setStatus('authenticated');
    }, []);

    const logout = useCallback(async () => {
        await authApi.logout();
        setUser(null);
        setStatus('unauthenticated');
    }, []);

    return (
        <AuthContext.Provider value={{ user, status, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return ctx;
}