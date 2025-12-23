import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import userModel from '../models/user.model';
import { AuthRequest } from '../types/auth.types';

interface JWTPayload {
    id: string;
}

export async function authUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    const { token } = req.cookies;

    if (!token) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JWTPayload;
        const user = await userModel.findById(decoded.id);

        if (!user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Unauthorized' });
    }
}

export default { authUser };
