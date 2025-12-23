import 'dotenv/config';
import http from 'http';
import app from './app';
import connectDb from './db/db';
import { initSocketServer } from './sockets/socket.server';

// Validate environment variables
if (!process.env.MONGODB_URI) {
    console.error('✗ MONGODB_URI is not defined in environment variables');
    process.exit(1);
}

if (!process.env.OPENAI_API_KEY) {
    console.error('✗ OPENAI_API_KEY is not defined in environment variables');
    process.exit(1);
}

if (!process.env.JWT_SECRET) {
    console.error('✗ JWT_SECRET is not defined in environment variables');
    process.exit(1);
}

const PORT = process.env.PORT || 3000;

// Create HTTP server
const httpServer = http.createServer(app);

// Initialize Socket.IO
initSocketServer(httpServer);

// Connect to database and start server
connectDb()
    .then(() => {
        httpServer.listen(PORT, () => {
            console.log(`✓ Server is running on port ${PORT}`);
            console.log(`✓ API: http://localhost:${PORT}`);
            console.log(`✓ Health check: http://localhost:${PORT}/health`);
        });
    })
    .catch((error) => {
        console.error('✗ Failed to start server:', error);
        process.exit(1);
    });

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    httpServer.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});
