import { GoogleGenAI } from '@google/genai';
import type { TicketWithRelations, MessageWithRelations, DraftReplyResult } from './index';

// Fast, highly accurate, and free-tier eligible model
const MODEL = 'gemini-3.5-flash-lite';
const MAX_CUSTOMER_MESSAGES = 5;

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

export async function generateGeminiDraftReply(
    ticket: TicketWithRelations,
    thread: MessageWithRelations[]
): Promise<DraftReplyResult> {
    const promptSnapshot = buildPrompt(ticket, thread);
    let draftText: string;

    try {
        const response = await getClient().models.generateContent({
            model: MODEL,
            contents: promptSnapshot,
            config: {
                maxOutputTokens: 512,
                temperature: 0.8,
                topP: 0.95,
                thinkingConfig: {
                    thinkingLevel: 'MINIMAL' as any
                }
            }
        });

        const textResult = response.candidates?.[0]?.content?.parts?.[0]?.text;
        
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
