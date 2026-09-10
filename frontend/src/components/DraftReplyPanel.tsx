import { useRef, useState } from 'react';
import { draftApi, ApiError, type DraftHistoryEntry } from '../api/client';

interface DraftReplyPanelProps {
    ticketId: string;
    onSend: (body: string) => Promise<void>;
}

function isCancelledError(err: unknown): boolean {
    return err instanceof ApiError && err.status === 0 && err.message === 'Cancelled.';
}

function getDraftErrorMessage(err: unknown): string {
    if (err instanceof ApiError) {
        if (err.status === 0) {
            // Timeout or network failure — client.ts already sets a clear message for these.
            return err.message;
        }
        if (err.status === 429) {
            return 'Too many draft requests right now. Wait a moment and try again.';
        }
        if (err.status >= 500) {
            return 'The AI service had a problem generating a draft. Try again shortly.';
        }
        if (err.status === 401) {
            return 'Your session has expired. Please log in again.';
        }
        return err.message;
    }
    return 'Something went wrong generating the draft.';
}

function getHistoryErrorMessage(err: unknown): string {
    if (err instanceof ApiError) {
        if (err.status === 0) return err.message;
        if (err.status === 401) return 'Your session has expired. Please log in again.';
        return 'Could not load draft history.';
    }
    return 'Could not load draft history.';
}

function isFailedEntry(entry: DraftHistoryEntry): boolean {
    return entry.responseSnapshot.startsWith('[FAILED]');
}

function cleanFailedMessage(entry: DraftHistoryEntry): string {
    return entry.responseSnapshot.replace(/^\[FAILED\]\s*/, '');
}

function truncate(text: string, max = 220): string {
    if (text.length <= max) return text;
    return text.slice(0, max).trimEnd() + '…';
}

function formatTimestamp(iso: string): string {
    return new Date(iso).toLocaleString();
}

function Spinner({ className = 'text-white' }: { className?: string }) {
    return (
        <svg
            className={`h-4 w-4 animate-spin ${className}`}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
        </svg>
    );
}

export function DraftReplyPanel({ ticketId, onSend }: DraftReplyPanelProps) {
    const [draftText, setDraftText] = useState<string | null>(null);
    const [modelUsed, setModelUsed] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyEntries, setHistoryEntries] = useState<DraftHistoryEntry[] | null>(null);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState<string | null>(null);

    async function loadHistory() {
        setHistoryLoading(true);
        setHistoryError(null);
        try {
            const entries = await draftApi.history(ticketId);
            setHistoryEntries(entries);
        } catch (err) {
            setHistoryError(getHistoryErrorMessage(err));
        } finally {
            setHistoryLoading(false);
        }
    }

    async function refreshHistoryIfOpen() {
        if (historyOpen) {
            await loadHistory();
        }
    }

    function toggleHistory() {
        const next = !historyOpen;
        setHistoryOpen(next);
        if (next && historyEntries === null) {
            void loadHistory();
        }
    }

    function handleUseHistoryEntry(entry: DraftHistoryEntry) {
        if (isFailedEntry(entry)) return;
        setDraftText(entry.responseSnapshot);
        setModelUsed(entry.modelUsed);
        setError(null);
    }

    async function handleGenerate() {
        const controller = new AbortController();
        abortControllerRef.current = controller;

        setGenerating(true);
        setError(null);
        try {
            const draft = await draftApi.generate(ticketId, controller.signal);
            setDraftText(draft.draftText);
            setModelUsed(draft.modelUsed);
        } catch (err) {
            if (isCancelledError(err)) {
                // User-initiated cancel isn't a failure — return to idle quietly.
            } else {
                setError(getDraftErrorMessage(err));
            }
        } finally {
            setGenerating(false);
            abortControllerRef.current = null;
            // Note: on cancel, the backend request may still be running and
            // will still log a row once it finishes — a just-cancelled attempt
            // may not appear here immediately.
            void refreshHistoryIfOpen();
        }
    }

    function handleCancel() {
        abortControllerRef.current?.abort();
    }

    async function handleSend() {
        if (!draftText || !draftText.trim()) return;
        setSending(true);
        setError(null);
        try {
            await onSend(draftText);
            setDraftText(null);
            setModelUsed(null);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to send reply.');
        } finally {
            setSending(false);
        }
    }

    function handleDiscard() {
        setDraftText(null);
        setModelUsed(null);
        setError(null);
    }

    const busy = generating || sending;

    return (
        <div className="mt-6 rounded-lg border border-line bg-surface p-4">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">AI Draft</span>
                <button
                    onClick={toggleHistory}
                    className="text-xs font-medium text-ink-soft underline hover:text-ink"
                >
                    {historyOpen ? 'Hide history' : 'View history'}
                </button>
            </div>

            {historyOpen && (
                <div className="mt-3 border-b border-line pb-4">
                    {historyLoading && historyEntries === null && (
                        <p className="text-xs text-ink-soft">Loading history…</p>
                    )}
                    {historyError && (
                        <div className="flex items-center gap-2">
                            <p className="text-xs text-priority-urgent">{historyError}</p>
                            <button
                                onClick={() => void loadHistory()}
                                className="text-xs font-medium text-ink-soft underline hover:text-ink"
                            >
                                Retry
                            </button>
                        </div>
                    )}
                    {!historyError && historyEntries !== null && historyEntries.length === 0 && (
                        <p className="text-xs text-ink-soft">No previous drafts for this ticket yet.</p>
                    )}
                    {!historyError && historyEntries !== null && historyEntries.length > 0 && (
                        <div className="mt-1 max-h-72 space-y-2 overflow-y-auto pr-1">
                            {historyEntries.map((entry) => {
                                const failed = isFailedEntry(entry);
                                return (
                                    <div key={entry.id} className="rounded-md border border-line bg-paper p-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs text-ink-soft">{formatTimestamp(entry.createdAt)}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs uppercase tracking-wide text-ink-soft">{entry.modelUsed}</span>
                                                {failed ? (
                                                    <span className="rounded-full bg-priority-urgent/10 px-2 py-0.5 text-xs font-medium text-priority-urgent">
                                                        Failed
                                                    </span>
                                                ) : (
                                                    <span className="rounded-full bg-status-open/10 px-2 py-0.5 text-xs font-medium text-status-open">
                                                        Generated
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <p className={`mt-2 text-sm ${failed ? 'text-priority-urgent' : 'text-ink'}`}>
                                            {failed ? cleanFailedMessage(entry) : truncate(entry.responseSnapshot)}
                                        </p>
                                        {!failed && (
                                            <button
                                                onClick={() => handleUseHistoryEntry(entry)}
                                                disabled={busy}
                                                className="mt-2 text-xs font-medium text-brand underline hover:text-brand-dark disabled:opacity-50"
                                            >
                                                Use this draft
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {draftText === null ? (
                <div className="mt-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className="flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand/90 disabled:opacity-50"
                        >
                            {generating && <Spinner />}
                            {generating ? 'Generating…' : 'Generate Draft'}
                        </button>
                        {generating && (
                            <button
                                onClick={handleCancel}
                                className="text-sm font-medium text-ink-soft underline hover:text-ink"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                    {generating && (
                        <p className="mt-2 text-xs text-ink-soft">
                            This can take anywhere from a few seconds up to a minute. You can cancel anytime.
                        </p>
                    )}
                </div>
            ) : (
                <div className="mt-4 space-y-3">
                    {modelUsed && (
                        <p className="text-xs uppercase tracking-wide text-ink-soft">
                            Draft ({modelUsed}) — review and edit before sending
                        </p>
                    )}
                    <textarea
                        value={draftText}
                        onChange={(e) => setDraftText(e.target.value)}
                        rows={5}
                        disabled={generating}
                        className="w-full rounded-md border border-line bg-paper p-3 text-sm text-ink focus:border-brand focus:outline-none disabled:opacity-60"
                    />
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={handleSend}
                                disabled={busy || !draftText.trim()}
                                className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand/90 disabled:opacity-50"
                            >
                                {sending ? 'Sending…' : 'Send'}
                            </button>
                            <button
                                onClick={handleDiscard}
                                disabled={busy}
                                className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink-soft transition hover:bg-paper disabled:opacity-50"
                            >
                                Discard
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={busy}
                                className="flex items-center gap-2 rounded-md border border-line px-4 py-2 text-sm font-medium text-ink-soft transition hover:bg-paper disabled:opacity-50"
                            >
                                {generating && <Spinner className="text-ink-soft" />}
                                {generating ? 'Regenerating…' : 'Regenerate'}
                            </button>
                            {generating && (
                                <button
                                    onClick={handleCancel}
                                    className="text-sm font-medium text-ink-soft underline hover:text-ink"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                        {generating && (
                            <p className="mt-2 text-xs text-ink-soft">
                                This can take anywhere from a few seconds up to a minute. You can cancel anytime.
                            </p>
                        )}
                    </div>
                </div>
            )}
            {error && <p className="mt-2 text-sm text-status-pending">{error}</p>}
        </div>
    );
}