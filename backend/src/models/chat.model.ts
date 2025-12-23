import mongoose, { Schema, Document } from 'mongoose';

export interface IChat extends Document {
    user: mongoose.Types.ObjectId;
    title: string;
    lastActivity: Date;
    createdAt: Date;
    updatedAt: Date;
}

const chatSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'user', required: true },
    title: { type: String, required: true },
    lastActivity: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model<IChat>('chat', chatSchema);
