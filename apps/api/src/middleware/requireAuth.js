import { ApiError } from '../lib/errors.js';
import { verifyAccessToken } from '../services/auth/tokens.js';

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return next(new ApiError(401, 'E_UNAUTHORIZED', 'Missing access token'));
  }
  try {
    const payload = await verifyAccessToken(token);
    req.user = { id: Number(payload.sub), email: payload.email, name: payload.name };
    return next();
  } catch {
    return next(new ApiError(401, 'E_UNAUTHORIZED', 'Invalid or expired access token'));
  }
}
