import mongoose, { Schema, Model } from 'mongoose';
import { IChat } from '../types';

const chatSchema = new Schema<IChat>({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    // Marks a chat as temporary (created on login). It will be renamed on first message
    // and may be deleted automatically if left unused.
    isTemp: {
        type: Boolean,
        default: false,
        index: true,
    },
    lastActivity: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
});

const chatModel: Model<IChat> = mongoose.model<IChat>("chat", chatSchema);

export default chatModel;
