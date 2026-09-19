import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import type { HttpError } from '../lib/http-error.js';

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: 'That endpoint does not exist' });
}

export function errorHandler(err: HttpError | ZodError, _req: Request, res: Response, _next: NextFunction): void {
  console.error(err);
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Check the highlighted fields', issues: err.issues });
    return;
  }
  const httpErr = err as HttpError;
  res.status(httpErr.status ?? 500).json({ error: httpErr.message || 'Something went wrong' });
}
