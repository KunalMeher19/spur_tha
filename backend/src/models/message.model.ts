import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
    user: mongoose.Types.ObjectId;
    chat: mongoose.Types.ObjectId;
    content: string;
    role: 'user' | 'model' | 'system';
    createdAt: Date;
    updatedAt: Date;
}

const messageSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'user' },
    chat: { type: Schema.Types.ObjectId, ref: 'chat' },
    content: { type: String, required: true },
    role: { type: String, enum: ['user', 'model', 'system'], default: 'user' }
}, { timestamps: true });

export default mongoose.model<IMessage>('message', messageSchema);
