import { Routes, Route } from 'react-router-dom';
import { useHealthCheck } from './hooks/useHealthCheck';
import { LoginPage } from './pages/LoginPage';
import { InboxPage } from './pages/InboxPage';
import { TicketPage } from './pages/TicketPage';
import { ProtectedRoute } from './components/ProtectedRoute';

function HealthCheckPage() {
  const { status, data } = useHealthCheck();

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper">
      <div className="rounded-lg border border-line bg-surface p-8 shadow-sm">
        <h1 className="font-display text-xl font-semibold text-ink">DeskMate</h1>
        <p className="mt-2 text-sm text-ink-soft">Backend connection check</p>

        <div className="mt-4">
          {status === 'loading' && (
            <span className="text-sm text-ink-soft">Checking…</span>
          )}
          {status === 'ok' && (
            <span className="text-sm text-status-open">
              ✓ Connected — {data?.status}
            </span>
          )}
          {status === 'error' && (
            <span className="text-sm text-priority-urgent">
              ✗ Could not reach backend. Is it running on port 5000?
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HealthCheckPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/inbox" element={ <ProtectedRoute> <InboxPage /> </ProtectedRoute> } />
      <Route path="/tickets/:id" element={ <ProtectedRoute> <TicketPage /> </ProtectedRoute> } />
    </Routes>
  );
}

export default App;