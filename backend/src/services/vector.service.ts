// Import the Pinecone library
import { Pinecone } from '@pinecone-database/pinecone';
import { Types } from 'mongoose';
import { VectorMemoryPayload, VectorQueryResult } from '../types';

// Initialize a Pinecone client with your API key
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY as string });

// Create a dense index with integrated embedding
const gptEmbeddingsIndex = pc.index('gpt-embeddings');

/* This is fnc to save the messages into the pinecone in embedded form */
async function createMemory({ vectors, metadata, messageId }: VectorMemoryPayload): Promise<void> {
    await gptEmbeddingsIndex.upsert([{
        id: messageId.toString(),
        values: vectors,
        metadata: {
            ...metadata,
            chat: metadata.chat.toString(),
            user: metadata.user?.toString() || null
        }
    }]);
}

/* This fnc query out the related vector we provided the ai as input prompt for context(LTM) */
async function queryMemory({
    queryVector,
    limit,
    metadata
}: {
    queryVector: number[],
    limit: number,
    metadata?: Record<string, any>
}): Promise<VectorQueryResult[]> {
    const data = await gptEmbeddingsIndex.query({
        vector: queryVector,
        topK: limit,
        filter: metadata ? metadata : undefined,
        includeMetadata: true
    });

    return (data.matches || []).map(match => ({
        id: match.id,
        score: match.score || 0,
        metadata: match.metadata || {}
    }));
}

async function deleteChatMemory(chatId: string | Types.ObjectId): Promise<void> {
    await gptEmbeddingsIndex.deleteMany({
        chat: { $eq: chatId.toString() }
    });
}

export { createMemory, queryMemory, deleteChatMemory };
