import { z } from 'zod';

// Validate that the :id param is a valid MongoDB ObjectId string (24 hex chars)
export const voteParamsSchema = z.object({
  id: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid post ID'),
});
