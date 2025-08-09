import { AnyZodObject, ZodError } from 'zod';
import { Request, Response, NextFunction } from 'express';

export function validate(schema: AnyZodObject) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({ body: req.body, query: req.query, params: req.params });
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Invalid request', details: err.flatten() });
      }
      next(err);
    }
  };
}
