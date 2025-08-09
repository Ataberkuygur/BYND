import { NextFunction, Request, Response } from 'express';
import pino from 'pino';

const logger = pino();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: Error & { status?: number; code?: string }, _req: Request, res: Response, _next: NextFunction) {
  const status = err.status || 500;
  const code = err.code || getErrorCode(status);
  logger.error({ err, code, status }, 'Unhandled error');
  if (res.headersSent) return;
  res.status(status).json({ 
    code, 
    message: err.message || getDefaultMessage(status),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

function getErrorCode(status: number): string {
  switch (status) {
    case 400: return 'BAD_REQUEST';
    case 401: return 'UNAUTHORIZED';
    case 403: return 'FORBIDDEN';
    case 404: return 'NOT_FOUND';
    case 409: return 'CONFLICT';
    case 422: return 'VALIDATION_ERROR';
    case 429: return 'RATE_LIMITED';
    case 500: return 'INTERNAL_ERROR';
    case 502: return 'BAD_GATEWAY';
    case 503: return 'SERVICE_UNAVAILABLE';
    default: return 'SERVER_ERROR';
  }
}

function getDefaultMessage(status: number): string {
  switch (status) {
    case 400: return 'Bad Request';
    case 401: return 'Unauthorized';
    case 403: return 'Forbidden';
    case 404: return 'Not Found';
    case 409: return 'Conflict';
    case 422: return 'Validation Error';
    case 429: return 'Too Many Requests';
    case 500: return 'Internal Server Error';
    case 502: return 'Bad Gateway';
    case 503: return 'Service Unavailable';
    default: return 'Server Error';
  }
}
