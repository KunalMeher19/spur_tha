import { Router } from 'express';
import { createChat, getChats, getMessages, sendChatMessage } from '../controllers/chat.controller';
import { authUser } from '../middleware/auth.middleware';

const router = Router();

// All chat routes require authentication
router.use(authUser);

// Assignment-required endpoint
router.post('/message', sendChatMessage);

// Existing endpoints
router.post('/', createChat);
router.get('/', getChats);
router.get('/messages/:id', getMessages);

export default router;
