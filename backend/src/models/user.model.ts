import mongoose, { Schema, Model } from 'mongoose';
import { IUser } from '../types';

const userSchema = new Schema<IUser>({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    fullName: {
        firstName: {
            type: String,
            required: true,
        },
        lastName: {
            type: String,
            required: true,
        }
    },
    password: {
        type: String,
        required: true,
    }
}, {
    timestamps: true
});

const userModel: Model<IUser> = mongoose.model<IUser>("user", userSchema);

export default userModel;
