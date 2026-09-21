import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from './token.helpers.js';
import { ApiError } from '../../utils/ApiError.js';
import { User } from '../../modules/users/User.js';

/**
 * Extend Express Request to include authenticated user fields.
 * Keeps type safety without mutating the global Request type.
 */
export interface AuthenticatedRequest extends Request {
  /** User identifier from JWT `sub` claim */
  userId?: string;
  /** Role string from JWT `role` claim */
  role?: 'user' | 'admin';
}

/**
 * Middleware that validates the JWT access token stored in the `accessToken`
 * httpOnly cookie. On success it attaches `userId` and `role` to the request.
 * All error messages are deliberately generic to prevent user enumeration.
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) {
  const token = req.cookies?.accessToken;
  if (!token) {
    return next(ApiError.unauthorized('Unauthorized'));
  }
  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    req.role = payload.role;
    return next();
  } catch {
    // Treat any verification error as unauthorized without revealing details.
    return next(ApiError.unauthorized('Unauthorized'));
  }
}

/**
 * Middleware that checks whether the authenticated user's email is verified.
 * Must be used after `requireAuth`.
 */
export async function ensureEmailVerified(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) {
  const userId = req.userId;
  if (!userId) {
    return next(ApiError.unauthorized('Unauthorized'));
  }
  try {
    const user = await User.findById(userId).select('isEmailVerified').exec();
    if (!user) {
      // Missing user treated as unauthorized to avoid enumeration.
      return next(ApiError.unauthorized('Unauthorized'));
    }
    if (!user.isEmailVerified) {
      return next(ApiError.forbidden('Access denied'));
    }
    return next();
  } catch (err) {
    // Forward unexpected errors to central error handler.
    return next(err);
  }
}

/**
 * Optional authentication middleware.
 * If accessToken cookie is provided and valid, attaches userId and role.
 * If absent or invalid, silently continues unauthenticated.
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) {
  const token = req.cookies?.accessToken;
  if (!token) {
    return next();
  }
  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    req.role = payload.role;
  } catch {
    // Silently continue for optional auth
  }
  return next();
}
