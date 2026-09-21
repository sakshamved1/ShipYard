import { z } from 'zod';
import { Types } from 'mongoose';

// Helper to validate ObjectId strings
const objectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId',
});

export const createCommentSchema = z.object({
  body: z.string().min(1).max(2000),
  parentId: objectIdSchema.optional(),
});

export const updateCommentSchema = z.object({
  body: z.string().min(1).max(2000),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  sort: z.enum(['oldest', 'newest']).default('oldest'),
});

export const bulkDeleteSchema = z.object({
  ids: z.array(objectIdSchema).nonempty(),
});
