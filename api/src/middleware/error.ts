import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'ValidationError', issues: err.issues });
  }
  if (err?.status && err?.message) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'InternalError' });
};

export const httpError = (status: number, message: string) => {
  const e = new Error(message) as Error & { status: number };
  e.status = status;
  return e;
};
