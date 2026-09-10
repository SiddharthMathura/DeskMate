import { useState } from 'react';
import type { Message } from '../types';

interface MessageThreadProps {
    messages: Message[];
    onSend?: (body: string) => Promise<void>;
}

function formatTimestamp(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function bubbleAlignment(senderType: Message['senderType']): string {
    return senderType === 'customer' ? 'items-start' : 'items-end';
}

function bubbleStyle(senderType: Message['senderType']): string {
    switch (senderType) {
        case 'customer':
            return 'bg-surface border border-line text-ink';
        case 'agent':
            return 'bg-brand text-white';
        case 'ai_draft':
            return 'bg-status-pending/10 border border-status-pending/30 text-ink';
        default:
            return 'bg-surface border border-line text-ink';
    }
}

function senderLabel(message: Message): string {
    if (message.senderType === 'customer') return 'Customer';
    if (message.senderType === 'ai_draft') return 'AI draft';
    return message.agent?.name ?? 'Agent';
}

export function MessageThread({ messages, onSend }: MessageThreadProps) {
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSend() {
        const body = draft.trim();
        if (!body || !onSend) return;

        setSending(true);
        setError(null);
        try {
            await onSend(body);
            setDraft('');
        } catch {
            setError('Failed to send message.');
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
                {messages.length === 0 ? (
                    <div className="rounded-lg border border-line bg-surface p-6 text-center">
                        <p className="text-sm text-ink-soft">No messages yet.</p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div key={message.id} className={`flex flex-col ${bubbleAlignment(message.senderType)}`}>
                            <span className="mb-1 text-xs text-ink-soft">
                                {senderLabel(message)} · {formatTimestamp(message.createdAt)}
                                {message.isDraft && ' · draft'}
                            </span>
                            <div className={`max-w-lg whitespace-pre-wrap break-words rounded-lg px-4 py-2.5 text-sm ${bubbleStyle(message.senderType)}`}>
                                {message.body}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {onSend && (
                <div className="rounded-lg border border-line bg-surface p-3">
                    {error && <p className="mb-2 text-sm text-priority-urgent">{error}</p>}
                    <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder="Write a reply…"
                        rows={3}
                        className="w-full resize-none rounded-md border border-line bg-paper p-2.5 text-sm text-ink outline-none focus:border-brand"
                    />
                    <div className="mt-2 flex justify-end">
                        <button
                            onClick={() => void handleSend()}
                            disabled={sending || !draft.trim()}
                            className="rounded-md bg-brand px-4 py-1.5 text-sm font-medium text-white transition hover:bg-brand-dark disabled:opacity-50"
                        >
                            {sending ? 'Sending…' : 'Send'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}