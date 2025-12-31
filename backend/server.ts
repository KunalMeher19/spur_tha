import 'dotenv/config';
import http from 'http';
import app from './src/app';
import initSocketServer from './src/sockets/socket.server';
import connectToDB from './src/db/db';

const httpServer = http.createServer(app);
const PORT = process.env.PORT || 3000;

/* Connecting to database */
connectToDB();
initSocketServer(httpServer);

httpServer.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
});