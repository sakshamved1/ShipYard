// src/modules/roadmap/index.ts
import { Router } from 'express';
import { getRoadmap } from './roadmap.controller.js';
import { optionalAuth } from '../auth/auth.middleware.js';

const router = Router();

// Public endpoint with optional authentication for optimistic hasVoted state
router.get('/', optionalAuth, getRoadmap);

export default router;
