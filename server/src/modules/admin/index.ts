// src/modules/admin/index.ts
import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import { requireAdmin } from './admin.middleware.js';
import { getPosts, patchPostStatus, getStats } from './admin.controller.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(requireAuth, requireAdmin);

router.get('/posts', getPosts);
router.patch('/posts/:id/status', patchPostStatus);
router.get('/stats', getStats);

export default router;
