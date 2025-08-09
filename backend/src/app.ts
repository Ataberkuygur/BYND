import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pino from 'pino';
import { registerRoutes } from './routes';
import { errorHandler } from './middleware/errorHandler';

const logger = pino({ transport: { target: 'pino-pretty' } });
export const app = express();

app.use(express.json({ limit: '2mb' }));
app.use(cors());
app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "img-src": ["'self'", 'data:'],
      "script-src": ["'self'", "'unsafe-inline'"],
      "style-src": ["'self'", "'unsafe-inline'"]
    }
  },
  crossOriginEmbedderPolicy: false // adjust if needed for certain responses
}));
app.use(rateLimit({ 
  windowMs: 60_000, 
  max: 120,
  message: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
}));

registerRoutes(app);
app.use(errorHandler);

export function startServer() {
  const port = process.env.PORT || 4000;
  return app.listen(port, () => logger.info(`BYND backend running on :${port}`));
}
