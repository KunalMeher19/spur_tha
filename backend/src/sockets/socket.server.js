const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const aiService = require("../services/ai.service");
const messageModel = require("../models/message.model");
const { createMemory, queryMemory } = require("../services/vector.service");

function initSocketServer(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN || "http://localhost:5173",
            allowedHeaders: ["Content-Type", "Authorization"],
            credentials: true
        },
        maxHttpBufferSize: 1e7 // 10MB for any future file uploads
    });

    // Authentication middleware
    io.use(async (socket, next) => {
        const cookies = cookie.parse(socket.handshake.headers?.cookie || "");

        if (!cookies.token) {
            return next(new Error("Authentication error: No token provided"));
        }

        try {
            const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET);
            const user = await userModel.findById(decoded.id);

            if (!user) {
                return next(new Error("Authentication error: User not found"));
            }

            socket.user = user;
            next();
        } catch (err) {
            next(new Error("Authentication error: Invalid token"));
        }
    });

    io.on("connection", (socket) => {
        console.log(`User connected: ${socket.user.email}`);

        socket.on("ai-message", async (messagePayload) => {
            try {
                /* messagePayload = { chat: chatId, content: message text } */

                // Input validation
                if (!messagePayload.content || messagePayload.content.trim() === '') {
                    socket.emit('ai-error', { message: 'Message cannot be empty' });
                    return;
                }

                if (messagePayload.content.length > 2000) {
                    socket.emit('ai-error', { message: 'Message too long (max 2000 characters)' });
                    return;
                }

                if (!messagePayload.chat) {
                    socket.emit('ai-error', { message: 'Chat ID is required' });
                    return;
                }

                // Emit typing indicator
                socket.emit('ai-typing', true);

                // Save user message to database
                const userMessage = await messageModel.create({
                    chat: messagePayload.chat,
                    user: socket.user._id,
                    content: messagePayload.content,
                    role: "user"
                });

                // Generate and store embeddings for vector memory
                let vectors;
                try {
                    vectors = await aiService.generateVector(messagePayload.content);

                    await createMemory({
                        vectors,
                        messageId: userMessage._id,
                        metadata: {
                            chat: messagePayload.chat,
                            user: socket.user._id,
                            text: messagePayload.content
                        }
                    });
                } catch (vectorError) {
                    console.error('Vector generation error:', vectorError);
                    // Continue even if vector generation fails
                }

                // Fetch conversation history (last 20 messages)
                const chatHistory = await messageModel.find({
                    chat: messagePayload.chat
                })
                    .sort({ createdAt: -1 })
                    .limit(20)
                    .lean()
                    .then(messages => messages.reverse());

                // Optionally fetch relevant long-term memory
                let memoryContext = [];
                if (vectors) {
                    try {
                        memoryContext = await queryMemory({
                            queryVector: vectors,
                            limit: 3,
                            metadata: {
                                user: socket.user._id
                            }
                        });
                    } catch (memoryError) {
                        console.error('Memory query error:', memoryError);
                        // Continue even if memory query fails
                    }
                }

                // Prepare conversation history for AI
                const conversationHistory = chatHistory.map(msg => ({
                    role: msg.role === 'model' ? 'assistant' : msg.role,
                    content: msg.content
                }));

                // Add memory context as a system message if available
                if (memoryContext.length > 0) {
                    const memoryText = memoryContext
                        .map(item => item.metadata.text)
                        .join('\n');

                    conversationHistory.unshift({
                        role: 'system',
                        content: `Previous context from memory:\n${memoryText}`
                    });
                }

                // Generate streaming AI response
                let fullResponse = '';

                await aiService.generateStreamingResponse(
                    conversationHistory,
                    (chunk) => {
                        fullResponse += chunk;
                        socket.emit('ai-stream-chunk', {
                            chunk,
                            chat: messagePayload.chat
                        });
                    }
                );

                // Emit typing indicator off
                socket.emit('ai-typing', false);

                // Emit complete response
                socket.emit('ai-response', {
                    content: fullResponse,
                    chat: messagePayload.chat
                });

                // Save AI response to database
                const aiMessage = await messageModel.create({
                    chat: messagePayload.chat,
                    user: socket.user._id,
                    content: fullResponse,
                    role: "model"
                });

                // Generate and store embeddings for AI response
                try {
                    const responseVectors = await aiService.generateVector(fullResponse);

                    await createMemory({
                        vectors: responseVectors,
                        messageId: aiMessage._id,
                        metadata: {
                            chat: messagePayload.chat,
                            user: socket.user._id,
                            text: fullResponse
                        }
                    });
                } catch (vectorError) {
                    console.error('Vector generation error for response:', vectorError);
                    // Continue even if vector generation fails
                }

            } catch (error) {
                console.error('AI Message Handler Error:', error);

                // Ensure typing indicator is off
                socket.emit('ai-typing', false);

                // Send error to client
                const errorMessage = error.message || 'An error occurred while processing your message';
                socket.emit('ai-error', { message: errorMessage });
            }
        });

        socket.on("disconnect", () => {
            console.log(`User disconnected: ${socket.user.email}`);
        });
    });

    return io;
}

module.exports = initSocketServer;