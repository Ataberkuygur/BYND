import type { Express } from 'express';
import { router as healthRouter } from './health';
import { router as tasksRouter } from './tasks';
import { router as authRouter } from './auth';
import { router as aiRouter } from './ai';
import { router as voiceRouter } from './voice';
import { router as calendarRouter } from './calendar';
import { router as paymentsRouter } from './payments';

export function registerRoutes(app: Express) {
  app.use('/health', healthRouter);
  app.use('/auth', authRouter);
  app.use('/tasks', tasksRouter);
  app.use('/ai', aiRouter);
  app.use('/voice', voiceRouter);
  app.use('/calendar', calendarRouter);
  app.use('/payments', paymentsRouter);
}
