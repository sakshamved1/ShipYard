import { z } from 'zod';

export const createPostSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(5, 'Title must be at least 5 characters')
    .max(120, 'Title cannot exceed 120 characters'),
  description: z
    .string({ required_error: 'Description is required' })
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description cannot exceed 5000 characters'),
  category: z.enum(['UI/UX', 'Integrations', 'Performance', 'General'], {
    errorMap: () => ({ message: 'Category must be UI/UX, Integrations, Performance, or General' }),
  }),
});

export const listPostsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  category: z.enum(['UI/UX', 'Integrations', 'Performance', 'General']).optional(),
  status: z.enum(['under_review', 'planned', 'in_progress', 'completed']).optional(),
  sort: z.enum(['trending', 'top', 'new', 'oldest']).default('top'),
  q: z.string().trim().max(100).optional(),
});

export const postIdParamSchema = z.object({
  id: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid post ID'),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type ListPostsQuery = z.infer<typeof listPostsQuerySchema>;
