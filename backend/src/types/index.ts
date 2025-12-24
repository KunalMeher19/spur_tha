import { Request } from 'express';
import { Types } from 'mongoose';

// ============================================================================
// Express Extensions
// ============================================================================

export interface AuthenticatedUser {
    _id: Types.ObjectId;
    email: string;
    fullName: {
        firstName: string;
        lastName: string;
    };
    password: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface AuthRequest extends Request {
    user?: AuthenticatedUser;
}

// ============================================================================
// Database Model Interfaces
// ============================================================================

export interface IUser {
    _id: Types.ObjectId;
    email: string;
    fullName: {
        firstName: string;
        lastName: string;
    };
    password: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IChat {
    _id: Types.ObjectId;
    user: Types.ObjectId;
    title: string;
    isTemp: boolean;
    lastActivity: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface IMessage {
    _id: Types.ObjectId;
    user?: Types.ObjectId;
    chat: Types.ObjectId;
    content: string;
    image?: string;
    prompt?: string;
    role: 'user' | 'model';
    createdAt: Date;
    updatedAt: Date;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface RegisterRequest {
    email: string;
    fullName: {
        firstName: string;
        lastName: string;
    };
    password: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface SendMessageRequest {
    message: string;
    sessionId?: string;
}

export interface SendMessageResponse {
    reply: string;
    sessionId: string;
}

// ============================================================================
// Socket.IO Event Payloads
// ============================================================================

export interface SocketSendMessagePayload {
    text: string;
    chatId: string;
    thinkingMode?: boolean;
}

export interface SocketImageMessagePayload {
    imageFile: string;
    text?: string;
    prompt?: string;
    chatId: string;
    thinkingMode?: boolean;
}

export interface SocketMessageChunk {
    chunk: string;
}

export interface SocketCompleteMessage {
    messageId: string;
    content: string;
}

export interface SocketErrorPayload {
    error: string;
}

// ============================================================================
// LangChain Service Types
// ============================================================================

export interface ConversationMessage {
    role: 'user' | 'model';
    content: string;
}

export interface LangChainOptions {
    model?: string;
    temperature?: number;
}

export interface ValidationResult {
    valid: boolean;
    error: string | null;
}

export type StreamChunkCallback = (chunk: string) => void;

// ============================================================================
// AI Service Types
// ============================================================================

export interface AIServiceOptions {
    model?: string;
    temperature?: number;
    mimeType?: string;
}

export interface GeminiStyleMessage {
    role: 'user' | 'model';
    parts: Array<{ text?: string; inlineData?: any }>;
}

// ============================================================================
// Vector Service Types
// ============================================================================

export interface VectorMemoryPayload {
    vectors: number[];
    messageId: Types.ObjectId;
    metadata: {
        chat: Types.ObjectId;
        user: Types.ObjectId | null;
        text: string;
    };
}

export interface VectorQueryResult {
    id: string;
    score: number;
    metadata: Record<string, any>;
}

// ============================================================================
// Storage Service Types
// ============================================================================

export interface ImageKitUploadResponse {
    fileId: string;
    name: string;
    url: string;
    thumbnailUrl?: string;
    height?: number;
    width?: number;
    size: number;
    filePath: string;
    tags?: string[];
    AITags?: Array<{ name: string; confidence: number }>;
}

// ============================================================================
// JWT Payload
// ============================================================================

export interface JWTPayload {
    id: string;
    iat?: number;
    exp?: number;
}

// ============================================================================
// FAQ Types
// ============================================================================

export interface FAQSection {
    title: string;
    details: string[];
    summary: string;
}

export interface TechStoreFAQ {
    storeName: string;
    storeDescription: string;
    shipping: FAQSection;
    returns: FAQSection;
    warranty: FAQSection;
    support: FAQSection;
    payment: FAQSection;
    orderTracking: FAQSection;
    priceMatch: FAQSection;
}
