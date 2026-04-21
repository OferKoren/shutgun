import type { RequestHandler } from 'express';
import { httpError } from './error.js';

declare module 'express-serve-static-core' {
  interface Request {
    memberId?: string;
  }
}

export const readMember: RequestHandler = (req, _res, next) => {
  const id = req.header('X-Member-Id');
  if (id) req.memberId = id;
  next();
};

export const requireMember: RequestHandler = (req, _res, next) => {
  if (!req.memberId) return next(httpError(401, 'X-Member-Id header required'));
  next();
};
