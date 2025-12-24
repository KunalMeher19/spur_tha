import express from 'express';
import { authUser, optionalAuth } from '../middlewares/auth.middleware';
import { createChat, getChats, getMessages, deleteChat } from '../controllers/chat.controllers';
import { sendMessage } from '../controllers/chatMessage.controller';

const router = express.Router();

// POST /api/chat/
router.route('/')
    .post(authUser, createChat);

// POST /api/chat/message (Assignment requirement - REST API endpoint)
router.post('/message', optionalAuth, sendMessage);

// NOTE: Image uploads are handled via socket.io now. The old /upload endpoint was removed.

/* GET /api/chat/ */
router.get('/', authUser, getChats);

/* GET /api/chat/messages/:id */
router.get('/messages/:id', authUser, getMessages);

/* DELETE /api/chat/messages/:id */
router.delete('/messages/:id', authUser, deleteChat);

export default router;
