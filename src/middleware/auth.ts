import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';

export interface SignableUser {
  id: string;
  email: string;
}

interface AccessTokenPayload extends jwt.JwtPayload {
  sub: string;
  email: string;
}

const JWT_SECRET = process.env.JWT_SECRET as string;

export function sign(user: SignableUser): string {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) { res.status(401).json({ error: 'Sign in to continue' }); return; }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AccessTokenPayload;
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Your session expired. Sign in again.' });
  }
}

// Never blocks — lets listing pages show whether the viewer already saved a place.
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(header.slice(7), JWT_SECRET) as AccessTokenPayload;
      req.userId = payload.sub;
    } catch {
      // Invalid or expired token on an optional route: proceed as a guest.
    }
  }
  next();
}
