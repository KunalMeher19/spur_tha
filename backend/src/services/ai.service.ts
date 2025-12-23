import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';

// FAQ Knowledge Base (Assignment Requirement #4)
const STORE_KNOWLEDGE = `You are a helpful customer support agent for "TechStore", an e-commerce electronics store.

**Store Information:**
- **Shipping**: Free shipping on orders over $50 to USA, Canada, and Mexico. Standard delivery takes 5-7 business days. International shipping available with additional fees.
- **Returns**: 30-day return policy. Items must be unused with original tags and packaging. Refunds processed within 5-7 business days to original payment method.
- **Support Hours**: Monday to Friday, 9 AM - 6 PM EST. Email: support@techstore.com, Phone: 1-800-TECH-STORE
- **Payment Methods**: We accept Visa, Mastercard, American Express, PayPal, Apple Pay, and Google Pay.
- **Warranty**: All products come with 1-year manufacturer warranty. Extended warranties (2 or 3 years) available at checkout for most items.
- **Price Match**: We match prices from major authorized retailers within 14 days of purchase.

Answer customer questions clearly, concisely, and professionally based on this information.`;

interface MessageHistory {
    role: 'user' | 'model' | 'system';
    content: string;
}

/**
 * Generate AI response using LangChain + OpenAI
 * Assignment Requirements: LangChain integration, FAQ knowledge, error handling
 */
export async function generateResponse(
    userMessage: string,
    conversationHistory: MessageHistory[] = []
): Promise<string> {
    try {
        // Initialize OpenAI model with LangChain (Assignment Requirement)
        const model = new ChatOpenAI({
            modelName: 'gpt-4o-mini',
            temperature: 0.7,
            maxTokens: 500, // Cost control (Assignment Requirement #6)
            timeout: 30000, // 30 second timeout (Assignment Requirement #6)
            openAIApiKey: process.env.OPENAI_API_KEY,
        });

        // Convert conversation history to LangChain format
        const messages = [
            new SystemMessage(STORE_KNOWLEDGE),
            ...conversationHistory.slice(-10).map(msg => {
                if (msg.role === 'user') {
                    return new HumanMessage(msg.content);
                } else if (msg.role === 'model') {
                    return new AIMessage(msg.content);
                } else {
                    return new SystemMessage(msg.content);
                }
            }),
            new HumanMessage(userMessage)
        ];

        // Generate response using LangChain
        const response = await model.invoke(messages);

        return response.content.toString();

    } catch (error: any) {
        // Graceful error handling (Assignment Requirement #6)
        console.error('AI Service Error:', error);

        if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
            throw new Error('AI service timeout. Please try again.');
        }
        if (error.status === 429 || error.message?.includes('rate limit')) {
            throw new Error('AI service is busy. Please try again in a moment.');
        }
        if (error.status === 401 || error.message?.includes('API key')) {
            throw new Error('AI service configuration error. Please contact support.');
        }
        if (error.status === 400) {
            throw new Error('Invalid request. Please check your message and try again.');
        }

        // Fallback error (Assignment Requirement: No crashes)
        throw new Error('AI service temporarily unavailable. Please try again.');
    }
}

/**
 * Simple response for testing without LLM
 */
export function getSimpleResponse(message: string): string {
    return `Echo: ${message}`;
}

export default {
    generateResponse,
    getSimpleResponse
};
