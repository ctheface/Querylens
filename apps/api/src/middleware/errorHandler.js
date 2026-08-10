import { ZodError } from 'zod';
import { ApiError } from '../lib/errors.js';

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }
  if (err instanceof ZodError) {
    return res.status(400).json({
      code: 'E_VALIDATION',
      message: err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
    });
  }
  if (err instanceof ApiError) {
    return res.status(err.status).json({ code: err.code, message: err.message });
  }
  console.error(`[${req.method} ${req.path}]`, err);
  return res.status(500).json({ code: 'E_INTERNAL', message: 'Internal server error' });
}
