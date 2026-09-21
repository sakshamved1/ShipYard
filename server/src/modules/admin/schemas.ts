// src/modules/admin/schemas.ts
import { z } from 'zod';
import { Types } from 'mongoose';
import { PostStatus } from '../posts/Post.js';

/** Validate MongoDB ObjectId strings */
const objectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId',
});

export const adminPostsSchema = z.object({
  id: objectIdSchema,
});

export const adminPatchStatusSchema = z.object({
  status: z.nativeEnum({
    under_review: 'under_review',
    planned: 'planned',
    in_progress: 'in_progress',
    completed: 'completed',
  } as any),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  sort: z.enum(['createdAt', 'voteCount', 'updatedAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  status: z.enum(['under_review', 'planned', 'in_progress', 'completed']).optional(),
  category: z.enum(['UI/UX', 'Integrations', 'Performance', 'General']).optional(),
  q: z.string().optional(),
});
