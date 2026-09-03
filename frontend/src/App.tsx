import { useHealthCheck } from './hooks/useHealthCheck';

function App() {
  const { status, data } = useHealthCheck();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">DeskMate</h1>
        <p className="mt-2 text-sm text-slate-500">Backend connection check</p>

        <div className="mt-4">
          {status === 'loading' && (
            <span className="text-sm text-slate-400">Checking...</span>
          )}
          {status === 'ok' && (
            <span className="text-sm text-emerald-600">
              ✓ Connected — {data?.status}
            </span>
          )}
          {status === 'error' && (
            <span className="text-sm text-red-600">
              ✗ Could not reach backend. Is it running on port 5000?
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;