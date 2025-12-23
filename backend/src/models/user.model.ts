import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    email: string;
    password: string;
    name?: string;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String }
}, { timestamps: true });

export default mongoose.model<IUser>('user', userSchema);
