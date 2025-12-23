const { ChatOpenAI } = require('@langchain/openai');
const { ChatPromptTemplate, MessagesPlaceholder } = require('@langchain/core/prompts');
const { HumanMessage, AIMessage, SystemMessage } = require('@langchain/core/messages');
const { generateFAQContext } = require('../constants/faq.constants');

// Model configuration
const MODELS = {
    BASIC: 'gpt-4o-mini',           // Fast, cost-effective for basic tasks
    THINKING: 'o3-mini',            // Reasoning model for thinking mode
    VISION: 'gpt-4o',               // Vision-capable model for images
};

/**
 * Generate streaming AI response using LangChain
 * @param {Array} conversationHistory - Array of previous messages [{role: 'user'|'model', content: string}]
 * @param {string} userMessage - Current user message
 * @param {Function} onChunk - Callback function called for each streamed token: (token) => void
 * @param {Object} opts - Options {model: string, temperature: number}
 * @returns {Promise<string>} - Complete AI response
 */
async function generateStreamingResponse(conversationHistory, userMessage, onChunk, opts = {}) {
    const modelName = opts.model || MODELS.BASIC;
    const temperature = opts.temperature || 0.7;

    try {
        // Initialize ChatOpenAI with streaming enabled
        const chatModel = new ChatOpenAI({
            modelName: modelName,
            temperature: temperature,
            streaming: true,
            openAIApiKey: process.env.OPENAI_API_KEY,
            maxTokens: 2000,
        });

        // Build messages array with FAQ context
        const messages = [];

        // Add system message with FAQ knowledge
        const faqContext = generateFAQContext();
        messages.push(new SystemMessage(faqContext));

        // Add conversation history
        if (conversationHistory && conversationHistory.length > 0) {
            conversationHistory.forEach(msg => {
                if (msg.role === 'user') {
                    messages.push(new HumanMessage(msg.content));
                } else if (msg.role === 'model') {
                    messages.push(new AIMessage(msg.content));
                }
            });
        }

        // Add current user message
        messages.push(new HumanMessage(userMessage));

        // Stream the response
        let fullResponse = '';
        const stream = await chatModel.stream(messages);
        console.log('[LangChain] Stream started');

        for await (const chunk of stream) {
            const content = chunk.content;
            if (content) {
                fullResponse += content;
                console.log('[LangChain] Chunk received:', content.substring(0, 20) + '...');
                // Call the chunk callback
                if (onChunk && typeof onChunk === 'function') {
                    onChunk(content);
                }
            }
        }
        console.log('[LangChain] Stream complete, total length:', fullResponse.length);

        return fullResponse;

    } catch (error) {
        console.error('[LangChain] Streaming error:', error.message);

        // Handle specific error types
        if (error.message.includes('API key')) {
            throw new Error('AI service configuration error. Please contact support.');
        } else if (error.message.includes('rate limit') || error.message.includes('429')) {
            throw new Error('AI service is busy. Please try again in a moment.');
        } else if (error.message.includes('timeout')) {
            throw new Error('AI service timeout. Please try again.');
        } else {
            throw new Error('AI service temporarily unavailable. Please try again later.');
        }
    }
}

/**
 * Generate AI response without streaming (for REST API)
 * @param {Array} conversationHistory - Array of previous messages [{role: 'user'|'model', content: string}]
 * @param {string} userMessage - Current user message
 * @param {Object} opts - Options {model: string, temperature: number}
 * @returns {Promise<string>} - Complete AI response
 */
async function generateResponse(conversationHistory, userMessage, opts = {}) {
    const modelName = opts.model || MODELS.BASIC;
    const temperature = opts.temperature || 0.7;

    try {
        // Initialize ChatOpenAI without streaming
        const chatModel = new ChatOpenAI({
            modelName: modelName,
            temperature: temperature,
            openAIApiKey: process.env.OPENAI_API_KEY,
            maxTokens: 2000,
        });

        // Build messages array with FAQ context
        const messages = [];

        // Add system message with FAQ knowledge
        const faqContext = generateFAQContext();
        messages.push(new SystemMessage(faqContext));

        // Add conversation history
        if (conversationHistory && conversationHistory.length > 0) {
            conversationHistory.forEach(msg => {
                if (msg.role === 'user') {
                    messages.push(new HumanMessage(msg.content));
                } else if (msg.role === 'model') {
                    messages.push(new AIMessage(msg.content));
                }
            });
        }

        // Add current user message
        messages.push(new HumanMessage(userMessage));

        // Get response
        const response = await chatModel.invoke(messages);
        return response.content;

    } catch (error) {
        console.error('[LangChain] Generation error:', error.message);

        // Handle specific error types
        if (error.message.includes('API key')) {
            throw new Error('AI service configuration error. Please contact support.');
        } else if (error.message.includes('rate limit') || error.message.includes('429')) {
            throw new Error('AI service is busy. Please try again in a moment.');
        } else if (error.message.includes('timeout')) {
            throw new Error('AI service timeout. Please try again.');
        } else {
            throw new Error('AI service temporarily unavailable. Please try again later.');
        }
    }
}

/**
 * Validate message input
 * @param {string} message - Message to validate
 * @returns {Object} - {valid: boolean, error: string}
 */
function validateMessage(message) {
    if (!message || typeof message !== 'string') {
        return { valid: false, error: 'Message is required' };
    }

    const trimmed = message.trim();

    if (trimmed.length === 0) {
        return { valid: false, error: 'Message cannot be empty' };
    }

    if (trimmed.length > 2000) {
        return { valid: false, error: 'Message too long (maximum 2000 characters)' };
    }

    return { valid: true, error: null };
}

module.exports = {
    generateStreamingResponse,
    generateResponse,
    validateMessage,
    MODELS
};
