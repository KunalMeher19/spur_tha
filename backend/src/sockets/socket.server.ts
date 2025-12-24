import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import cookie from 'cookie';
import jwt from 'jsonwebtoken';
import sharp from 'sharp';
import userModel from '../models/user.model';
import { contentGenerator, embeddingGenerator, generateTitleFromText } from '../services/ai.service';
import uploadFile from '../services/storage.service';
import messageModel from '../models/message.model';
import { createMemory, queryMemory } from '../services/vector.service';
import chatModel from '../models/chat.model';
import { generateStreamingResponse, validateMessage, MODELS } from '../services/langchain.service';
import { JWTPayload, AuthenticatedUser } from '../types';

// Extend Socket interface to include user
interface AuthenticatedSocket extends Socket {
    user?: AuthenticatedUser;
}

// Socket.IO event payload interfaces
interface AIImageMessagePayload {
    chat: string;
    content?: string;
    image: string;
    previewId?: string;
}

interface AIMessagePayload {
    chat: string;
    content: string;
    mode?: 'thinking' | 'normal';
}

// Dynamic import for file-type (ES module)
let fileTypeFromBuffer: any;
(async () => {
    const fileTypeModule = await import('file-type');
    fileTypeFromBuffer = fileTypeModule.fileTypeFromBuffer;
})();

function initSocketServer(httpServer: HTTPServer): void {

    // Increase maxHttpBufferSize so clients can send larger binary/base64 payloads
    const io = new SocketIOServer(httpServer, {
        maxHttpBufferSize: 20 * 1024 * 1024, // 20 MB
        cors: {
            origin: "http://localhost:5173",
            allowedHeaders: ["Content-Type", "Authorization"],
            credentials: true
        }
    });

    /*  Socket.io Middleware */
    io.use(async (socket: AuthenticatedSocket, next) => {
        const cookies = cookie.parse(socket.handshake.headers?.cookie || "");

        if (!cookies.token) {
            return next(new Error("Authentication error: No token provided"));
        }

        try {
            const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET as string) as JWTPayload;
            const user = await userModel.findById(decoded.id);
            if (user) {
                socket.user = user.toObject();
            }
            next();
        } catch (err) {
            next(new Error("Authentication error: Invalid token"));
        }
    });


    // Track number of connected users
    let connectedUsers = 0;

    io.on("connection", (socket: AuthenticatedSocket) => {
        connectedUsers += 1;
        // Single concise log on user connect
        console.log(`user ${socket.id} connected (connected users: ${connectedUsers})`);

        // Image handling function extracted so we can expose a dedicated event and keep backward compatibility
        const processImagePayload = async (messagePayload: AIImageMessagePayload): Promise<void> => {
            const chatId = messagePayload.chat;
            const userPrompt = messagePayload.content || '';

            // 1) Extract base64 from incoming data URL or raw base64
            let originalData = messagePayload.image;
            let base64Data: string | null = null;
            const dataUriMatch = String(originalData).match(/^data:([a-zA-Z0-9\-+\/]+\/[a-zA-Z0-9\-+.]+)?;base64,(.*)$/);
            if (dataUriMatch) {
                base64Data = dataUriMatch[2];
            } else {
                base64Data = String(originalData).replace(/^data:.*;base64,/, '');
            }

            const buffer = Buffer.from(base64Data, 'base64');

            // 2) Detect type, convert HEIC/HEIF, and downscale large images to speed up processing+upload
            let fileTypeResult: any = null;
            try {
                if (fileTypeFromBuffer) {
                    fileTypeResult = await fileTypeFromBuffer(buffer);
                } else {
                    console.warn('file-type module not yet loaded, using fallback');
                }
            } catch (e: any) {
                console.warn('file-type detection failed', e && (e.message || e));
            }

            let ext = 'jpg';
            let mime = 'image/jpeg';
            if (fileTypeResult && fileTypeResult.ext && fileTypeResult.mime) {
                ext = fileTypeResult.ext.replace('+', '');
                mime = fileTypeResult.mime;
            }

            const fileName = `user_upload_${Date.now()}.${ext}`;

            // Prepare a processed buffer we can both feed to AI and upload later
            let processedBuffer = buffer;
            let processedMime = mime;
            let processedExt = ext;
            let converted = false;
            try {
                let img = sharp(buffer);
                // Convert HEIC/HEIF to JPEG for compatibility
                if (fileTypeResult && /heic|heif/i.test(fileTypeResult.ext)) {
                    img = img.jpeg({ quality: 82 });
                    processedMime = 'image/jpeg';
                    processedExt = 'jpg';
                    converted = true;
                }

                // Optional: resize very large images to reduce payload and latency (max 1600px)
                const meta = await img.metadata();
                const maxDim = 1600;
                if ((meta.width && meta.width > maxDim) || (meta.height && meta.height > maxDim)) {
                    img = img.resize({ width: (meta.width && meta.width > (meta.height || 0)) ? maxDim : undefined, height: (meta.height && meta.height >= (meta.width || 0)) ? maxDim : undefined, fit: 'inside', withoutEnlargement: true });
                    // Ensure a reasonable output format
                    if (processedMime === 'image/jpeg' || processedExt === 'jpg' || /jpe?g/i.test(processedExt)) {
                        img = img.jpeg({ quality: 82, mozjpeg: true });
                        processedMime = 'image/jpeg';
                        processedExt = 'jpg';
                    } else if (/png/i.test(processedExt)) {
                        img = img.png({ compressionLevel: 8 });
                        processedMime = 'image/png';
                        processedExt = 'png';
                    }
                }
                processedBuffer = await img.toBuffer();
            } catch (e: any) {
                console.warn('Image processing failed, falling back to original buffer', e && (e.message || e));
                processedBuffer = buffer;
                processedMime = mime;
                processedExt = ext;
            }

            const processedDataUri = `data:${processedMime};base64,${processedBuffer.toString('base64')}`;

            // 3) Create the user message immediately (without waiting for upload)
            const userMessage = await messageModel.create({
                user: socket.user!._id,
                chat: chatId,
                content: userPrompt ? userPrompt : 'Uploaded image',
                // image will be attached after upload completes
                prompt: userPrompt,
                role: 'user'
            });

            // Touch chat lastActivity and rename temp chat if this is the first message
            let updatedTitle: string | undefined;
            try {
                await chatModel.findByIdAndUpdate(chatId, { $set: { lastActivity: new Date() } });
                const [msgCount, chatDoc] = await Promise.all([
                    messageModel.countDocuments({ chat: chatId }),
                    chatModel.findById(chatId).lean()
                ]);
                if (chatDoc && chatDoc.isTemp && msgCount === 1) {
                    const newTitle = await generateTitleFromText(userPrompt || 'Image conversation');
                    await chatModel.findByIdAndUpdate(chatId, { $set: { title: newTitle, isTemp: false, lastActivity: new Date() } });
                    updatedTitle = newTitle;
                }
            } catch (e: any) {
                console.warn('Temp chat title update failed (image path):', e && (e.message || e));
            }

            // 4) Generate AI response right away using the processed data (no upload dependency)
            // Note: o3-mini (thinking model) doesn't support images, so always use vision model for image uploads
            // Use gpt-4o for vision tasks regardless of thinking mode
            const modelOverride = 'gpt-4o';

            const aiResponse = await contentGenerator(processedDataUri, userPrompt, { model: modelOverride, mimeType: processedMime });

            const aiMessage = await messageModel.create({
                user: socket.user!._id,
                chat: chatId,
                content: aiResponse,
                role: 'model'
            });
            try { await chatModel.findByIdAndUpdate(chatId, { $set: { lastActivity: new Date() } }); } catch { }

            // 5) Emit AI response immediately (faster perceived latency). Include previewId for client-side correlation.
            const respPayload: any = { content: aiResponse, chat: chatId, ...(updatedTitle ? { title: updatedTitle } : {}) };
            if (messagePayload.previewId) respPayload.previewId = messagePayload.previewId;
            socket.emit('ai-response', respPayload);

            // 6) In the background: upload the (processed) image and emit a follow-up event when done
            (async () => {
                try {
                    const uploadData = `data:${processedMime};base64,${processedBuffer.toString('base64')}`;
                    const nameForUpload = `user_upload_${Date.now()}.${processedExt}`;
                    const uploadResp = await uploadFile(uploadData, nameForUpload);
                    const hostedUrl = uploadResp && (uploadResp.url || uploadResp.filePath || uploadResp.name) ? (uploadResp.url || uploadResp.filePath || uploadResp.name) : null;

                    if (hostedUrl) {
                        try {
                            await messageModel.findByIdAndUpdate(userMessage._id, { $set: { image: hostedUrl } });
                        } catch (e: any) {
                            console.warn('Failed to patch user message with hosted image URL', e && (e.message || e));
                        }
                        // Notify client to replace the local preview with hosted URL
                        const imgPayload: any = { chat: chatId, imageData: hostedUrl };
                        if (messagePayload.previewId) imgPayload.previewId = messagePayload.previewId;
                        socket.emit('image-uploaded', imgPayload);
                    }
                } catch (err: any) {
                    console.error('Image upload failed (background):', err && (err.message || err));
                    const errPayload: any = { chat: chatId, error: 'Image upload failed' };
                    if (messagePayload.previewId) errPayload.previewId = messagePayload.previewId;
                    socket.emit('image-upload-error', errPayload);
                }
            })();

            // 7) Also run embeddings in the background to avoid blocking the response
            (async () => {
                try {
                    const [uVec, aVec] = await Promise.all([
                        embeddingGenerator(userMessage.content),
                        embeddingGenerator(aiResponse)
                    ]);
                    await createMemory({ vectors: uVec, messageId: userMessage._id, metadata: { chat: chatId, user: socket.user!._id, text: userMessage.content } });
                    await createMemory({ vectors: aVec, messageId: aiMessage._id, metadata: { chat: chatId, user: socket.user!._id, text: aiResponse } });
                } catch (e: any) {
                    console.warn('Embedding generation failed for uploaded image flow (background)', e && (e.message || e));
                }
            })();
        };

        // Listener for image+text payloads
        socket.on("ai-image-message", async (messagePayload: AIImageMessagePayload) => {
            try {
                await processImagePayload(messagePayload);
            } catch (error) {
                console.error('ai-image-message handler error:', error);
                socket.emit("ai-response", {
                    content: "Something went wrong processing the image, please try again.",
                    chat: messagePayload && messagePayload.chat
                });
            }
        });

        // Text-only messages with LangChain streaming support
        socket.on("ai-message", async (messagePayload: AIMessagePayload) => {
            try {
                // Input validation
                const validation = validateMessage(messagePayload.content);

                if (!validation.valid) {
                    socket.emit("ai-error", {
                        message: validation.error,
                        chat: messagePayload.chat
                    });
                    return;
                }

                // Emit typing indicator
                socket.emit("ai-typing", true);

                const [message, vectors] = await Promise.all([
                    messageModel.create({
                        user: socket.user!._id,
                        chat: messagePayload.chat,
                        content: messagePayload.content,
                        role: "user"
                    }),
                    embeddingGenerator(messagePayload.content)
                ]);

                // If this is the first message in a temp chat, generate a title and update the chat
                try {
                    const chatId = messagePayload.chat;
                    const [msgCount, chatDoc] = await Promise.all([
                        messageModel.countDocuments({ chat: chatId }),
                        chatModel.findById(chatId).lean()
                    ]);
                    // msgCount includes the just-created user message; first real message means count === 1
                    if (chatDoc && chatDoc.isTemp && msgCount === 1) {
                        const newTitle = await generateTitleFromText(messagePayload.content);
                        await chatModel.findByIdAndUpdate(chatId, { $set: { title: newTitle, isTemp: false, lastActivity: new Date() } });
                    }
                } catch (e: any) {
                    console.warn('Failed to generate/update temp chat title:', e && (e.message || e));
                }

                // Fetch conversation history and memory
                const [memory, chatHistory] = await Promise.all([
                    queryMemory({
                        queryVector: vectors,
                        limit: 3,
                        metadata: { user: socket.user!._id }
                    }),
                    messageModel.find({ chat: messagePayload.chat }).sort({ createdAt: -1 }).limit(20).lean().then(messages => messages.reverse()),
                    createMemory({
                        vectors,
                        messageId: message._id,
                        metadata: { chat: messagePayload.chat, user: socket.user!._id, text: messagePayload.content }
                    })
                ]);

                // Build conversation history for LangChain
                const conversationHistory: Array<{ role: 'user' | 'model', content: string }> = [];

                // Add retrieved memory as context (optional - can be prepended as a system-like message)
                if (memory && memory.length > 0) {
                    const memoryContext = memory.map(item => item.metadata.text).join("\n");
                    conversationHistory.push({
                        role: 'user',
                        content: `Context from previous conversations:\n${memoryContext}\n\n---\n`
                    });
                    conversationHistory.push({
                        role: 'model',
                        content: 'I understand and will use this context to maintain continuity.'
                    });
                }

                // Add recent chat history
                chatHistory.forEach((msg: any) => {
                    conversationHistory.push({
                        role: msg.role === 'model' ? 'model' : 'user',
                        content: msg.content
                    });
                });

                // Determine model based on mode
                let modelOverride: string | undefined = undefined;
                if (messagePayload.mode === 'thinking') {
                    modelOverride = MODELS.THINKING;
                }

                // Stream AI response using LangChain
                let fullResponse = '';

                try {
                    fullResponse = await generateStreamingResponse(
                        conversationHistory,
                        messagePayload.content,
                        (chunk: string) => {
                            // Emit each chunk in real-time
                            socket.emit('ai-stream-chunk', {
                                chunk,
                                chat: messagePayload.chat
                            });
                        },
                        modelOverride ? { model: modelOverride } : {}
                    );
                } catch (streamError: any) {
                    console.error('LangChain streaming error:', streamError);
                    // Emit typing indicator off
                    socket.emit("ai-typing", false);

                    socket.emit("ai-error", {
                        message: streamError.message || 'AI service unavailable',
                        chat: messagePayload.chat
                    });
                    return;
                }

                // Emit typing indicator off
                socket.emit("ai-typing", false);

                // Fetch latest chat doc to include updated title if it changed
                let updatedTitle: string | undefined;
                try {
                    const c = await chatModel.findById(messagePayload.chat).lean();
                    updatedTitle = c && c.title;
                } catch { }

                // Emit complete response (backward compatibility)
                socket.emit("ai-response", {
                    content: fullResponse,
                    chat: messagePayload.chat,
                    ...(updatedTitle ? { title: updatedTitle } : {})
                });

                // Save AI response to database
                const [responseMessage, responseVectors] = await Promise.all([
                    messageModel.create({
                        user: socket.user!._id,
                        chat: messagePayload.chat,
                        content: fullResponse,
                        role: "model"
                    }),
                    embeddingGenerator(fullResponse)
                ]);

                // Store response in vector DB
                await createMemory({
                    vectors: responseVectors,
                    messageId: responseMessage._id,
                    metadata: {
                        chat: messagePayload.chat,
                        user: socket.user!._id,
                        text: fullResponse
                    }
                });

            } catch (error) {
                console.error("Socket AI handler error:", error);
                socket.emit("ai-typing", false);
                socket.emit("ai-error", {
                    message: "Something went wrong, please try again.",
                    chat: messagePayload && messagePayload.chat
                });
            }
        });

        socket.on("disconnect", () => {
            connectedUsers = Math.max(0, connectedUsers - 1);
            console.log(`user ${socket.id} disconnected`);
            console.log(`connected users: ${connectedUsers}`);
        });
    });

    // Removed periodic logging of connected users to prevent noisy logs

}

export default initSocketServer;
