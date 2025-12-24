import mongoose, { Schema, Model } from 'mongoose';
import { IMessage } from '../types';

const messageSchema = new Schema<IMessage>({
    user: {
        type: Schema.Types.ObjectId,
        ref: "user"
    },
    chat: {
        type: Schema.Types.ObjectId,
        ref: "chat"
    },
    content: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: false
    },
    prompt: {
        type: String,
        required: false
    },
    role: {
        type: String,
        enum: ["user", "model"],
        default: "user"
    }
}, {
    timestamps: true
});

const messageModel: Model<IMessage> = mongoose.model<IMessage>("message", messageSchema);

export default messageModel;
