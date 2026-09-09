import { useRef, useState } from 'react';
import { draftApi, ApiError } from '../api/client';

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
            {draftText === null ? (
                <div>
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
                <div className="space-y-3">
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