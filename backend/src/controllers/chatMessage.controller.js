const chatModel = require('../models/chat.model');
const messageModel = require('../models/message.model');
const langchainService = require('../services/langchain.service');
const aiService = require('../services/ai.service');

/**
 * POST /api/chat/message - Assignment-compliant REST endpoint
 * Accepts: { message: string, sessionId?: string }
 * Returns: { reply: string, sessionId: string }
 */
async function sendMessage(req, res) {
    try {
        const { message, sessionId } = req.body;

        // Input validation
        const validation = langchainService.validateMessage(message);
        if (!validation.valid) {
            return res.status(400).json({
                error: validation.error
            });
        }

        let chatId = sessionId;
        let userId = null;

        // Check if user is authenticated
        if (req.user) {
            userId = req.user._id;
        }

        // If sessionId provided, verify it exists and belongs to user (if authenticated)
        if (chatId) {
            const existingChat = await chatModel.findById(chatId);
            if (!existingChat) {
                return res.status(404).json({
                    error: 'Session not found'
                });
            }
            // If user is authenticated, verify ownership
            if (userId && String(existingChat.user) !== String(userId)) {
                return res.status(403).json({
                    error: 'Access denied to this session'
                });
            }
        } else {
            // Create new chat session
            // If authenticated, associate with user; otherwise create anonymous session
            if (userId) {
                const newChat = await chatModel.create({
                    user: userId,
                    title: 'New Chat',
                    isTemp: true
                });
                chatId = newChat._id;
            } else {
                // For assignment demo: create temp user or handle anonymous
                // For now, require authentication
                return res.status(401).json({
                    error: 'Authentication required. Please log in or provide a valid sessionId.'
                });
            }
        }

        // Save user message to database
        const userMessage = await messageModel.create({
            user: userId,
            chat: chatId,
            content: message,
            role: 'user'
        });

        // Fetch conversation history
        const chatHistory = await messageModel
            .find({ chat: chatId })
            .sort({ createdAt: 1 })
            .limit(20)
            .lean();

        // Build conversation history for LangChain (exclude current message as it's passed separately)
        const conversationHistory = chatHistory
            .filter(msg => String(msg._id) !== String(userMessage._id))
            .map(msg => ({
                role: msg.role === 'model' ? 'model' : 'user',
                content: msg.content
            }));

        // Generate AI response using LangChain (non-streaming for REST)
        let aiResponse;
        try {
            aiResponse = await langchainService.generateResponse(
                conversationHistory,
                message
            );
        } catch (error) {
            console.error('AI generation error:', error);
            return res.status(500).json({
                error: error.message || 'AI service unavailable'
            });
        }

        // Save AI response to database
        await messageModel.create({
            user: userId,
            chat: chatId,
            content: aiResponse,
            role: 'model'
        });

        // Update chat lastActivity and generate title if first message
        try {
            const msgCount = await messageModel.countDocuments({ chat: chatId });
            const chatDoc = await chatModel.findById(chatId).lean();

            if (chatDoc && chatDoc.isTemp && msgCount === 2) {
                // First exchange (user + AI), generate title
                const newTitle = await aiService.generateTitleFromText(message);
                await chatModel.findByIdAndUpdate(chatId, {
                    $set: {
                        title: newTitle,
                        isTemp: false,
                        lastActivity: new Date()
                    }
                });
            } else {
                // Just update lastActivity
                await chatModel.findByIdAndUpdate(chatId, {
                    $set: { lastActivity: new Date() }
                });
            }
        } catch (e) {
            console.warn('Failed to update chat metadata:', e.message);
        }

        // Generate embeddings in background (don't block response)
        (async () => {
            try {
                const [userEmbedding, aiEmbedding] = await Promise.all([
                    aiService.embeddingGenerator(message),
                    aiService.embeddingGenerator(aiResponse)
                ]);

                const vectorService = require('../services/vector.service');
                await Promise.all([
                    vectorService.createMemory({
                        vectors: userEmbedding,
                        messageId: userMessage._id,
                        metadata: { chat: chatId, user: userId, text: message }
                    }),
                    vectorService.createMemory({
                        vectors: aiEmbedding,
                        messageId: userMessage._id,
                        metadata: { chat: chatId, user: userId, text: aiResponse }
                    })
                ]);
            } catch (e) {
                console.warn('Background embedding generation failed:', e.message);
            }
        })();

        // Return response
        return res.status(200).json({
            reply: aiResponse,
            sessionId: String(chatId)
        });

    } catch (error) {
        console.error('sendMessage error:', error);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
}

module.exports = {
    sendMessage
};
