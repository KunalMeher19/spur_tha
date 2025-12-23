import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import cookie from 'cookie';
import jwt from 'jsonwebtoken';
import userModel, { IUser } from '../models/user.model';
import messageModel from '../models/message.model';
import chatModel from '../models/chat.model';
import { generateResponse } from '../services/ai.service';

interface JWTPayload {
    id: string;
}

interface SocketWithUser extends Socket {
    user?: IUser;
}

interface MessagePayload {
    chat: string;
    content: string;
}

export function initSocketServer(httpServer: HttpServer): void {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
            allowedHeaders: ['Content-Type', 'Authorization'],
            credentials: true
        },
        maxHttpBufferSize: 1e6 // 1MB limit
    });

    // Socket.IO authentication middleware
    io.use(async (socket: SocketWithUser, next) => {
        const cookies = cookie.parse(socket.handshake.headers?.cookie || '');

        if (!cookies.token) {
            return next(new Error('Authentication error: No token provided'));
        }

        try {
            const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET as string) as JWTPayload;
            const user = await userModel.findById(decoded.id);

            if (!user) {
                return next(new Error('Authentication error: User not found'));
            }

            socket.user = user;
            next();
        } catch (err) {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket: SocketWithUser) => {
        console.log(`✓ User connected: ${socket.user?.email}`);

        socket.on('ai-message', async (messagePayload: MessagePayload) => {
            try {
                const user = socket.user;
                if (!user) {
                    socket.emit('ai-error', { message: 'Unauthorized' });
                    return;
                }

                // INPUT VALIDATION (Assignment Requirement #6)
                if (!messagePayload.content || messagePayload.content.trim().length === 0) {
                    socket.emit('ai-error', { message: 'Message cannot be empty' });
                    return;
                }

                if (messagePayload.content.length > 2000) {
                    socket.emit('ai-error', { message: 'Message too long (max 2000 characters)' });
                    return;
                }

                // Verify chat belongs to user
                const chat = await chatModel.findOne({ _id: messagePayload.chat, user: user._id });
                if (!chat) {
                    socket.emit('ai-error', { message: 'Chat not found' });
                    return;
                }

                // TYPING INDICATOR (Assignment UX Requirement)
                socket.emit('ai-typing', true);

                // Save user message
                const userMessage = await messageModel.create({
                    chat: messagePayload.chat,
                    user: user._id,
                    content: messagePayload.content.trim(),
                    role: 'user'
                });

                // Get recent conversation history (last 10 messages for context)
                const chatHistory = await messageModel
                    .find({ chat: messagePayload.chat })
                    .sort({ createdAt: -1 })
                    .limit(10)
                    .lean()
                    .then(messages => messages.reverse());

                // Format history for LangChain
                const formattedHistory = chatHistory.slice(0, -1).map(msg => ({
                    role: msg.role as 'user' | 'model' | 'system',
                    content: msg.content
                }));

                // Generate AI response using LangChain (Assignment Requirement)
                const aiResponse = await generateResponse(
                    messagePayload.content.trim(),
                    formattedHistory
                );

                // Turn off typing indicator
                socket.emit('ai-typing', false);

                // Send AI response to client
                socket.emit('ai-response', {
                    content: aiResponse,
                    chat: messagePayload.chat
                });

                // Save AI response to database
                await messageModel.create({
                    chat: messagePayload.chat,
                    user: user._id,
                    content: aiResponse,
                    role: 'model'
                });

                // Update chat last activity
                await chatModel.findByIdAndUpdate(messagePayload.chat, {
                    lastActivity: new Date()
                });

            } catch (error: any) {
                console.error('Socket.IO ai-message error:', error);

                // Turn off typing indicator on error
                socket.emit('ai-typing', false);

                // Send user-friendly error message (Assignment Requirement #6)
                const errorMessage = error.message || 'Failed to process message. Please try again.';
                socket.emit('ai-error', { message: errorMessage });
            }
        });

        socket.on('disconnect', () => {
            console.log(`✗ User disconnected: ${socket.user?.email}`);
        });
    });

    console.log('✓ Socket.IO server initialized');
}

export default initSocketServer;
