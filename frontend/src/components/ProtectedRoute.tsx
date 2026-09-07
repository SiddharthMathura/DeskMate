import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
    children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { status } = useAuth();
    const location = useLocation();

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-paper">
                <p className="text-sm text-ink-soft">Checking session…</p>
            </div>
        );
    }

    if (status === 'unauthenticated') {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return <>{children}</>;
}