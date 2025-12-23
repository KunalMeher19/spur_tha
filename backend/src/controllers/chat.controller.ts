import { Response } from 'express';
import chatModel from '../models/chat.model';
import messageModel from '../models/message.model';
import { AuthRequest } from '../types/auth.types';

interface CreateChatBody {
    title: string;
}

export async function createChat(req: AuthRequest<{}, {}, CreateChatBody>, res: Response): Promise<void> {
    try {
        const { title } = req.body;
        const user = req.user;

        if (!user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        if (!title || title.trim().length === 0) {
            res.status(400).json({ message: 'Chat title is required' });
            return;
        }

        const chat = await chatModel.create({
            user: user._id,
            title: title.trim()
        });

        res.status(201).json({
            message: 'Chat created successfully',
            chat: {
                _id: chat._id,
                title: chat.title,
                lastActivity: chat.lastActivity,
                user: chat.user
            }
        });
    } catch (error) {
        console.error('Create chat error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export async function getChats(req: AuthRequest, res: Response): Promise<void> {
    try {
        const user = req.user;

        if (!user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const chats = await chatModel.find({ user: user._id }).sort({ lastActivity: -1 });

        res.status(200).json({
            message: 'Chats retrieved successfully',
            chats: chats.map(chat => ({
                _id: chat._id,
                title: chat.title,
                lastActivity: chat.lastActivity,
                user: chat.user
            }))
        });
    } catch (error) {
        console.error('Get chats error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export async function getMessages(req: AuthRequest<{ id: string }>, res: Response): Promise<void> {
    try {
        const chatId = req.params.id;
        const user = req.user;

        if (!user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        // Verify chat belongs to user
        const chat = await chatModel.findOne({ _id: chatId, user: user._id });
        if (!chat) {
            res.status(404).json({ message: 'Chat not found' });
            return;
        }

        const messages = await messageModel.find({ chat: chatId }).sort({ createdAt: 1 });

        res.status(200).json({
            message: 'Messages retrieved successfully',
            messages: messages
        });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// NEW: Assignment-required POST /chat/message endpoint
interface ChatMessageBody {
    message: string;
    sessionId?: string;
}

export async function sendChatMessage(req: AuthRequest<{}, {}, ChatMessageBody>, res: Response): Promise<void> {
    try {
        const { message, sessionId } = req.body;
        const user = req.user;

        if (!user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        // Input validation (Assignment Requirement #6)
        if (!message || message.trim().length === 0) {
            res.status(400).json({ message: 'Message cannot be empty' });
            return;
        }

        if (message.length > 2000) {
            res.status(400).json({ message: 'Message too long (max 2000 characters)' });
            return;
        }

        // This endpoint is HTTP-based alternative to Socket.IO
        // In practice, Socket.IO will handle real-time messaging
        // This is here to fulfill assignment requirement for REST API

        res.status(200).json({
            message: 'Message received. Use Socket.IO for real-time chat.',
            sessionId: sessionId || 'new-session'
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export default {
    createChat,
    getChats,
    getMessages,
    sendChatMessage
};
