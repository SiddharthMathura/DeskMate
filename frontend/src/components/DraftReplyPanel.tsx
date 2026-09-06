import { useState } from 'react';
import { draftApi, ApiError } from '../api/client';

interface DraftReplyPanelProps {
    ticketId: string;
    onSend: (body: string) => Promise<void>;
}

export function DraftReplyPanel({ ticketId, onSend }: DraftReplyPanelProps) {
    const [draftText, setDraftText] = useState<string | null>(null);
    const [modelUsed, setModelUsed] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleGenerate() {
        setGenerating(true);
        setError(null);
        try {
            const draft = await draftApi.generate(ticketId);
            setDraftText(draft.draftText);
            setModelUsed(draft.modelUsed);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to generate draft.');
        } finally {
            setGenerating(false);
        }
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

    return (
        <div className="mt-6 rounded-lg border border-line bg-surface p-4">
            {draftText === null ? (
                <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand/90 disabled:opacity-50"
                >
                    {generating ? 'Generating…' : 'Generate Draft'}
                </button>
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
                        className="w-full rounded-md border border-line bg-paper p-3 text-sm text-ink focus:border-brand focus:outline-none"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={handleSend}
                            disabled={sending || !draftText.trim()}
                            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand/90 disabled:opacity-50"
                        >
                            {sending ? 'Sending…' : 'Send'}
                        </button>
                        <button
                            onClick={handleDiscard}
                            disabled={sending}
                            className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink-soft transition hover:bg-paper disabled:opacity-50"
                        >
                            Discard
                        </button>
                        <button
                            onClick={handleGenerate}
                            disabled={generating || sending}
                            className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink-soft transition hover:bg-paper disabled:opacity-50"
                        >
                            {generating ? 'Regenerating…' : 'Regenerate'}
                        </button>
                    </div>
                </div>
            )}
            {error && <p className="mt-2 text-sm text-status-pending">{error}</p>}
        </div>
    );
}