import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';

// Routes Imports
import authRouter from './routers/auth.router';
import chatRouter from './routers/chat.router';

const app = express();

const allowedOrigins = [
    'https://aura-autologin.netlify.app',
    'https://aura-x4bd.onrender.com',     // your app origin
    'http://localhost:5173'               // dev origin you used earlier
];

// Middlewares
app.use(cors(
    {
        origin: allowedOrigins,
        credentials: true,
    }
));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/chat', chatRouter);

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

export default app;
