const { ChatOpenAI, OpenAIEmbeddings } = require("@langchain/openai");
const { HumanMessage, SystemMessage, AIMessage } = require("@langchain/core/messages");

// Initialize OpenAI with LangChain
const chatModel = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.7,
    streaming: true,
    openAIApiKey: process.env.OPENAI_API_KEY,
});

// Initialize embeddings model
const embeddingsModel = new OpenAIEmbeddings({
    modelName: "text-embedding-3-small",
    dimensions: 768,
    openAIApiKey: process.env.OPENAI_API_KEY,
});

// TechStore FAQ Knowledge Base
const FAQ_KNOWLEDGE = `
You are a helpful customer support agent for TechStore, an e-commerce electronics store.

Here is important information about our store policies:

**Shipping Policy:**
- Free shipping on all orders over $50
- Standard shipping takes 5-7 business days
- We ship to USA, Canada, and Mexico
- Express shipping available for additional cost

**Return & Refund Policy:**
- 30-day return policy from date of delivery
- Items must be unused and in original packaging
- Refunds processed within 5-7 business days after we receive the return
- Return shipping cost is customer's responsibility unless item is defective

**Support Hours:**
- Monday to Friday: 9:00 AM - 6:00 PM EST
- Weekend: Closed
- Email: support@techstore.com
- Phone: 1-800-TECH-STORE

**Payment Methods:**
- Visa, Mastercard, American Express
- PayPal
- Apple Pay
- Google Pay

**Warranty Information:**
- All products come with 1-year manufacturer's warranty
- Extended warranty plans available at checkout
- Warranty covers manufacturing defects only

Please answer customer questions clearly and concisely. Be friendly, professional, and helpful.
If you don't know the answer to a question, politely say so and direct them to contact support.
`;

/**
 * Generate AI response with conversation history (non-streaming)
 * Used for REST API endpoint
 */
async function generateResponse(conversationHistory) {
    try {
        // Build messages array
        const messages = [
            new SystemMessage(FAQ_KNOWLEDGE),
        ];

        // Add conversation history
        for (const msg of conversationHistory) {
            if (msg.role === 'user') {
                messages.push(new HumanMessage(msg.content));
            } else if (msg.role === 'model' || msg.role === 'assistant') {
                messages.push(new AIMessage(msg.content));
            }
        }

        // Generate response
        const response = await chatModel.invoke(messages);
        return response.content;

    } catch (error) {
        console.error('AI Service Error:', error);
        throw mapErrorToUserMessage(error);
    }
}

/**
 * Generate streaming AI response with conversation history
 * Used for Socket.IO real-time chat
 */
async function generateStreamingResponse(conversationHistory, onChunk) {
    try {
        // Build messages array
        const messages = [
            new SystemMessage(FAQ_KNOWLEDGE),
        ];

        // Add conversation history
        for (const msg of conversationHistory) {
            if (msg.role === 'user') {
                messages.push(new HumanMessage(msg.content));
            } else if (msg.role === 'model' || msg.role === 'assistant') {
                messages.push(new AIMessage(msg.content));
            }
        }

        // Stream response
        let fullResponse = '';
        const stream = await chatModel.stream(messages);

        for await (const chunk of stream) {
            const content = chunk.content;
            if (content) {
                fullResponse += content;
                onChunk(content); // Emit chunk via callback
            }
        }

        return fullResponse;

    } catch (error) {
        console.error('AI Streaming Error:', error);
        throw mapErrorToUserMessage(error);
    }
}

/**
 * Generate embeddings for text (for vector database)
 */
async function generateVector(content) {
    try {
        const embeddings = await embeddingsModel.embedDocuments([content]);
        return embeddings[0]; // Return first (and only) embedding vector
    } catch (error) {
        console.error('Embedding Error:', error);
        throw new Error('Failed to generate embeddings');
    }
}

/**
 * Map OpenAI errors to user-friendly messages
 */
function mapErrorToUserMessage(error) {
    const errorMessage = error.message || '';
    const errorCode = error.status || error.code;

    // Rate limit error
    if (errorCode === 429 || errorMessage.includes('rate limit')) {
        return new Error('AI is currently busy. Please try again in a moment.');
    }

    // Authentication error
    if (errorCode === 401 || errorMessage.includes('authentication') || errorMessage.includes('API key')) {
        return new Error('AI service configuration error. Please contact support.');
    }

    // Timeout error
    if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
        return new Error('Request timed out. Please try again.');
    }

    // Model overload
    if (errorCode === 503 || errorMessage.includes('overloaded') || errorMessage.includes('unavailable')) {
        return new Error('AI service is temporarily unavailable. Please try again.');
    }

    // Generic error
    return new Error('AI service encountered an error. Please try again.');
}

module.exports = {
    generateResponse,
    generateStreamingResponse,
    generateVector
};