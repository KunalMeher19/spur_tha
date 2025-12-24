import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import userModel from '../models/user.model';
import { AuthRequest, JWTPayload } from '../types';

async function authUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    const { token } = req.cookies;

    if (!token) {
        res.status(401).json({
            message: "Unauthorized request",
        });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JWTPayload;
        if (!decoded) {
            res.status(401).json({
                message: "Invalid token",
            });
            return;
        }

        const user = await userModel.findOne({
            _id: decoded.id
        });

        if (user) {
            req.user = user.toObject();
        }

        next();
    } catch (err) {
        res.status(401).json({
            message: "Unauthorized: ",
            error: err,
        });
    }
}

// Optional auth - allows both authenticated and unauthenticated requests
async function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): Promise<void> {
    const { token } = req.cookies;

    if (!token) {
        // No token, proceed without user
        req.user = undefined;
        next();
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JWTPayload;
        if (decoded) {
            const user = await userModel.findOne({ _id: decoded.id });
            if (user) {
                req.user = user.toObject();
            }
        }
    } catch (err) {
        // Invalid token, proceed without user
        req.user = undefined;
    }

    next();
}

export {
    authUser,
    optionalAuth
};
