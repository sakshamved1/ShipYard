// src/modules/admin/admin.middleware.ts
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth/auth.middleware.js';
import { ApiError } from '../../utils/ApiError.js';

/** Middleware that ensures the authenticated user has admin role */
export function requireAdmin(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  if (req.role !== 'admin') {
    return next(ApiError.forbidden('Access denied'));
  }
  return next();
}
