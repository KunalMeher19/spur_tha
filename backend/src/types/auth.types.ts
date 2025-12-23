import { Request } from 'express';
import { IUser } from '../models/user.model';

export interface AuthRequest<P = {}, ResBody = any, ReqBody = any> extends Request<P, ResBody, ReqBody> {
    user?: IUser;
}
