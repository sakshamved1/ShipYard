import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../modules/auth/auth.middleware.js';
import { ApiError } from '../../utils/ApiError.js';
import * as service from './comment.service.js';
import { createCommentSchema, updateCommentSchema, paginationSchema, bulkDeleteSchema } from './schemas.js';

/** GET /posts/:postId/comments */
export async function getComments(req: Request, res: Response, next: NextFunction) {
  try {
    const { postId } = req.params as { postId: string };
    const parsed = paginationSchema.safeParse(req.query);
    if (!parsed.success) {
      throw ApiError.badRequest('Invalid pagination parameters');
    }
    const { page, limit, sort } = parsed.data;
    const { comments, meta } = await service.getTopLevelComments(postId, page, limit, sort);
    // Extract root IDs to fetch replies
    const rootIds = comments
      .filter((c) => c.root)
      .map((c) => c.root as unknown as import('mongoose').Types.ObjectId);
    const replies = rootIds.length ? await service.getReplies(rootIds) : [];
    // Return flat array (comments + replies)
    const data = [...comments, ...replies];
    res.json({ data, meta });
  } catch (err) {
    next(err);
  }
}

/** POST /posts/:postId/comments */
export async function createComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { postId } = req.params as { postId: string };
    const parsed = createCommentSchema.safeParse(req.body);
    if (!parsed.success) {
      throw ApiError.badRequest('Invalid comment payload');
    }
    const { body, parentId } = parsed.data;
    const comment = await service.createComment(req.userId!, postId, body, parentId);
    res.status(201).json({ data: comment });
  } catch (err) {
    next(err);
  }
}

/** PATCH /comments/:id */
export async function updateComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params as { id: string };
    const parsed = updateCommentSchema.safeParse(req.body);
    if (!parsed.success) {
      throw ApiError.badRequest('Invalid update payload');
    }
    const { body } = parsed.data;
    const comment = await service.updateComment(req, id, body);
    res.json({ data: comment });
  } catch (err) {
    next(err);
  }
}

/** DELETE /comments/:id */
export async function deleteComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params as { id: string };
    const result = await service.deleteComment(req, id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/** DELETE /comments (admin bulk delete) */
export async function bulkDeleteComments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = bulkDeleteSchema.safeParse(req.body);
    if (!parsed.success) {
      throw ApiError.badRequest('Invalid bulk delete payload');
    }
    const { ids } = parsed.data;
    const outcome = await service.bulkDeleteComments(req, ids);
    res.json(outcome);
  } catch (err) {
    next(err);
  }
}
