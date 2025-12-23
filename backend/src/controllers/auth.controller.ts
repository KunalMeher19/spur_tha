import { Request, Response } from 'express';
import userModel from '../models/user.model';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

interface RegisterBody {
    email: string;
    password: string;
    name?: string;
}

interface LoginBody {
    email: string;
    password: string;
}

export async function registerUser(req: Request<{}, {}, RegisterBody>, res: Response): Promise<void> {
    try {
        const { email, password, name } = req.body;

        // Validation
        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required' });
            return;
        }

        const isUserAlreadyExists = await userModel.findOne({ email });

        if (isUserAlreadyExists) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }

        const hashPassword = await bcrypt.hash(password, 10);

        const user = await userModel.create({
            email,
            password: hashPassword,
            name
        });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET as string);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                email: user.email,
                _id: user._id,
                name: user.name
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export async function loginUser(req: Request<{}, {}, LoginBody>, res: Response): Promise<void> {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required' });
            return;
        }

        const user = await userModel.findOne({ email });

        if (!user) {
            res.status(400).json({ message: 'Invalid email or password' });
            return;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            res.status(400).json({ message: 'Invalid email or password' });
            return;
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET as string);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });

        res.status(200).json({
            message: 'User logged in successfully',
            user: {
                email: user.email,
                _id: user._id,
                name: user.name
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export default {
    registerUser,
    loginUser
};
