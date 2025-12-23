const chatModel = require('../models/chat.model');
const messageModel = require('../models/message.model');
const aiService = require('../services/ai.service');


async function createChat(req, res) {

    const { title } = req.body;
    const user = req.user;

    const chat = await chatModel.create({
        user: user._id,
        title
    });

    res.status(201).json({
        message: "Chat created successfully",
        chat: {
            _id: chat._id,
            title: chat.title,
            lastActivity: chat.lastActivity,
            user: chat.user
        }
    });

}

async function getChats(req, res) {
    const user = req.user;

    const chats = await chatModel.find({ user: user._id });

    res.status(200).json({
        message: "Chats retrieved successfully",
        chats: chats.map(chat => ({
            _id: chat._id,
            title: chat.title,
            lastActivity: chat.lastActivity,
            user: chat.user
        }))
    });
}

async function getMessages(req, res) {

    const chatId = req.params.id;

    const messages = await messageModel.find({ chat: chatId }).sort({ createdAt: 1 });

    res.status(200).json({
        message: "Messages retrieved successfully",
        messages: messages
    })

}

/**
 * POST /api/chat/message endpoint (Assignment requirement)
 * Accepts { message: string, sessionId?: string }
 * Returns { reply: string, sessionId: string }
 */
async function sendMessage(req, res) {
    try {
        const { message, sessionId } = req.body;
        const user = req.user;

        // Input validation
        if (!message || message.trim() === '') {
            return res.status(400).json({ error: 'Message cannot be empty' });
        }

        if (message.length > 2000) {
            return res.status(400).json({ error: 'Message too long (max 2000 characters)' });
        }

        // Get or create chat session
        let chat;
        if (sessionId) {
            chat = await chatModel.findById(sessionId);

            if (!chat) {
                return res.status(404).json({ error: 'Session not found' });
            }

            // Verify user owns this chat
            if (chat.user.toString() !== user._id.toString()) {
                return res.status(403).json({ error: 'Access denied to this session' });
            }
        } else {
            // Create new chat session
            const titlePreview = message.substring(0, 50) + (message.length > 50 ? '...' : '');
            chat = await chatModel.create({
                user: user._id,
                title: titlePreview
            });
        }

        // Save user message to database
        await messageModel.create({
            chat: chat._id,
            user: user._id,
            content: message,
            role: 'user'
        });

        // Fetch conversation history (last 20 messages)
        const chatHistory = await messageModel.find({ chat: chat._id })
            .sort({ createdAt: 1 })
            .limit(20)
            .lean();

        // Prepare conversation for AI
        const conversationHistory = chatHistory.map(msg => ({
            role: msg.role === 'model' ? 'assistant' : msg.role,
            content: msg.content
        }));

        // Generate AI response (non-streaming)
        const reply = await aiService.generateResponse(conversationHistory);

        // Save AI response to database
        await messageModel.create({
            chat: chat._id,
            user: user._id,
            content: reply,
            role: 'model'
        });

        // Update chat's lastActivity
        await chatModel.findByIdAndUpdate(chat._id, { lastActivity: new Date() });

        // Return response
        res.json({
            reply,
            sessionId: chat._id
        });

    } catch (error) {
        console.error('Send Message Error:', error);

        // Handle AI service errors
        const errorMessage = error.message || 'An error occurred while processing your message';
        res.status(500).json({ error: errorMessage });
    }
}

module.exports = {
    createChat,
    getChats,
    getMessages,
    sendMessage
};
