import express from 'express';
import { ensureEmailVerified, requireAuth } from '../auth/auth.middleware.js';
import { commentRateLimiter } from '../../middleware/rateLimiters.js';
import * as controller from './comment.controller.js';

const router = express.Router();

// GET top‑level comments + replies
router.get('/posts/:postId/comments', controller.getComments);

// Create comment
router.post('/posts/:postId/comments', requireAuth, ensureEmailVerified, commentRateLimiter, controller.createComment);

// Update comment
router.patch('/comments/:id', requireAuth, ensureEmailVerified, commentRateLimiter, controller.updateComment);

// Delete comment (single)
router.delete('/comments/:id', requireAuth, ensureEmailVerified, commentRateLimiter, controller.deleteComment);

// Admin bulk delete
router.delete('/comments', requireAuth, ensureEmailVerified, commentRateLimiter, controller.bulkDeleteComments);

export default router;

export {};
