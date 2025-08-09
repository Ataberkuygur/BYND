import { NextFunction, Request, Response } from 'express';
import pino from 'pino';

const logger = pino();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: Error & { status?: number; code?: string }, _req: Request, res: Response, _next: NextFunction) {
  const status = err.status || 500;
  const code = err.code || (status === 400 ? 'BAD_REQUEST' : status === 401 ? 'UNAUTHORIZED' : status === 404 ? 'NOT_FOUND' : 'SERVER_ERROR');
  logger.error({ err, code, status }, 'Unhandled error');
  if (res.headersSent) return;
  res.status(status).json({ code, message: err.message || 'Internal Server Error' });
}
