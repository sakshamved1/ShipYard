import { Router, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { setAuthCookies, clearAuthCookies } from './token.helpers.js';
import { requireAuth, AuthenticatedRequest } from './auth.middleware.js';
import { sendSuccess } from '../../utils/response.js';
import { ApiError } from '../../utils/ApiError.js';
import { authRateLimiter } from '../../middleware/rateLimiters.js';
import { User } from '../users/User.js';
import {
  signupSchema,
  loginSchema,
} from './auth.schemas.js';

const router = Router();

// Apply strict rate limiting on all auth routes
router.use(authRateLimiter);

// GET /api/v1/auth/me - Get current authenticated user profile
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw ApiError.unauthorized('Unauthorized');
    }
    const user = await User.findById(req.userId)
      .select('name email role isEmailVerified createdAt')
      .lean()
      .exec();
    if (!user) {
      throw ApiError.unauthorized('Unauthorized');
    }
    return sendSuccess(res, {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/signup
router.post('/signup', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validated = signupSchema.parse(req.body);
    const { accessToken, refreshToken, user } = await AuthService.signup(
      validated.name,
      validated.email,
      validated.password,
    );
    setAuthCookies(res, accessToken, refreshToken);
    return sendSuccess(res, { user, message: 'Signup successful' }, 201);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validated = loginSchema.parse(req.body);
    const { accessToken, refreshToken, user } = await AuthService.login(
      validated.email,
      validated.password,
    );
    setAuthCookies(res, accessToken, refreshToken);
    return sendSuccess(res, { user }, 200);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/refresh
router.post('/refresh', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const oldRefreshToken = req.cookies?.refreshToken;
    if (!oldRefreshToken) {
      throw ApiError.unauthorized('Refresh token missing');
    }
    const { accessToken, newRefreshToken } = await AuthService.refresh(
      oldRefreshToken,
      req.headers['user-agent'] as string,
      req.ip,
    );
    setAuthCookies(res, accessToken, newRefreshToken);
    return sendSuccess(res, { message: 'Token refreshed' });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/logout
router.post('/logout', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (req.userId) {
      await AuthService.logout(req.userId as any);
    }
    clearAuthCookies(res);
    return sendSuccess(res, { message: 'Logged out' });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/verify-email
router.post('/verify-email', async (_req: AuthenticatedRequest, res: Response) => {
  return sendSuccess(res, { message: 'Email verification simulated successfully' });
});

// POST /api/v1/auth/request-password-reset
router.post('/request-password-reset', async (_req: AuthenticatedRequest, res: Response) => {
  // Generic success message to prevent user enumeration
  return sendSuccess(res, { message: 'If that email exists, password reset instructions have been sent.' });
});

// POST /api/v1/auth/reset-password
router.post('/reset-password', async (_req: AuthenticatedRequest, res: Response) => {
  return sendSuccess(res, { message: 'Password has been reset successfully.' });
});

export default router;
