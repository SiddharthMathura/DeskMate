import { GoogleGenAI } from '@google/genai';
import type { TicketWithRelations, MessageWithRelations, DraftReplyResult } from './index';

// Fast, highly accurate, and free-tier eligible model
export const MODEL = 'gemini-3.5-flash-lite';
const MAX_CUSTOMER_MESSAGES = 5;
const MAX_OUTPUT_TOKENS = 2048; // raised from 512 — 512 was tight enough to truncate normal-length replies
const RETRY_DELAY_MS = 1500;

let ai: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
    if (!ai) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error(
                'GEMINI_API_KEY is not set. Add it to backend/.env to use AI_DRAFT_MODE=live.'
            );
        }
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
}

function buildPrompt(ticket: TicketWithRelations, thread: MessageWithRelations[]): string {
    const customerMessages = thread
        .filter((m) => m.senderType === 'customer')
        .slice(-MAX_CUSTOMER_MESSAGES);

    const threadText = customerMessages.length
        ? customerMessages.map((m, i) => `Customer message ${i + 1}: ${m.body}`).join('\n\n')
        : 'No customer messages yet.';

    return [
        `Ticket subject: ${ticket.subject}`,
        `Customer name: ${ticket.customer.name}`,
        '',
        threadText,
        '',
        'Write a helpful, professional, and empathetic support reply addressing the customer\'s most recent message. Keep it concise (3-5 sentences), sign off as "The Support Team", and return only the reply body — no subject line, no preamble, and no markdown formatting.',
    ].join('\n');
}

/**
 *(Gemini "high demand" / 5xx),
 * If a retry fires, the console.warn below will show the raw error
 */
function isTransientCapacityError(err: unknown): boolean {
    if (!(err instanceof Error)) return false;

    const status = (err as any).status ?? (err as any).code ?? (err as any).httpStatus;
    if (status === 500 || status === 503) return true;

    const msg = err.message.toLowerCase();
    return (
        msg.includes('high demand') ||
        msg.includes('resource_exhausted') ||
        msg.includes('unavailable') ||
        msg.includes('internal error') ||
        msg.includes('500') ||
        msg.includes('503')
    );
}

async function callGemini(promptSnapshot: string) {
    return getClient().models.generateContent({
        model: MODEL,
        contents: promptSnapshot,
        config: {
            maxOutputTokens: MAX_OUTPUT_TOKENS,
            temperature: 0.8,
            topP: 0.95,
            thinkingConfig: {
                thinkingLevel: 'MINIMAL' as any
            }
        }
    });
}

export async function generateGeminiDraftReply(
    ticket: TicketWithRelations,
    thread: MessageWithRelations[]
): Promise<DraftReplyResult> {
    const promptSnapshot = buildPrompt(ticket, thread);
    let draftText: string;

    try {
        let response;
        try {
            response = await callGemini(promptSnapshot);
        } catch (firstErr) {
            if (isTransientCapacityError(firstErr)) {
                console.warn(
                    '[ai-draft/gemini] transient capacity error on first attempt, retrying once. Raw error:',
                    firstErr instanceof Error ? firstErr.message : firstErr
                );
                await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
                response = await callGemini(promptSnapshot);
            } else {
                throw firstErr;
            }
        }

        const candidate = response.candidates?.[0];
        const finishReason = candidate?.finishReason;

        if (finishReason !== 'STOP') {
            throw new Error(
                `Gemini response did not finish cleanly (finishReason: ${finishReason ?? 'unknown'}). Refusing to return a possibly truncated draft.`
            );
        }

        const textResult = candidate?.content?.parts?.[0]?.text;
        if (!textResult) {
            throw new Error('Gemini API structure returned empty text segments.');
        }

        draftText = textResult.trim();
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        throw new Error(`AI draft generation failed: ${message}`);
    }

    return { draftText, modelUsed: MODEL, promptSnapshot };
}