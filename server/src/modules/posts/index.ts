import { Router } from 'express';
import * as controller from './posts.controller.js';
import { requireAuth, optionalAuth, ensureEmailVerified } from '../auth/auth.middleware.js';
import { postRateLimiter, voteRateLimiter } from '../../middleware/rateLimiters.js';

const router = Router();

// GET /api/v1/posts - List posts with pagination, filters, sort, and optionalAuth for hasVoted
router.get('/', optionalAuth, controller.getPosts);

// POST /api/v1/posts - Create a new post (requires verified user and rate limited)
router.post('/', requireAuth, ensureEmailVerified, postRateLimiter, controller.createPost);

// GET /api/v1/posts/:id - Get single post by id with optionalAuth for hasVoted
router.get('/:id', optionalAuth, controller.getPost);

// POST /api/v1/posts/:id/vote - Toggle vote on post (requires verified user and rate limited)
router.post('/:id/vote', requireAuth, ensureEmailVerified, voteRateLimiter, controller.votePost);

export default router;
