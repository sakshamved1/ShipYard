import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth/auth.middleware.js';
import {
  createPostSchema,
  listPostsQuerySchema,
  postIdParamSchema,
} from './posts.schemas.js';
import * as postsService from './posts.service.js';
import { sendSuccess } from '../../utils/response.js';
import { ApiError } from '../../utils/ApiError.js';

export async function getPosts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const validatedQuery = listPostsQuerySchema.parse(req.query);
    const result = await postsService.listPosts(validatedQuery, req.userId);
    return sendSuccess(res, result.posts, 200, result.meta);
  } catch (err) {
    next(err);
  }
}

export async function createPost(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw ApiError.unauthorized('Unauthorized');
    }
    const validatedBody = createPostSchema.parse(req.body);
    const post = await postsService.createPost(req.userId, validatedBody);
    return sendSuccess(res, post, 201);
  } catch (err) {
    next(err);
  }
}

export async function getPost(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = postIdParamSchema.parse(req.params);
    const post = await postsService.getPostById(id, req.userId);
    return sendSuccess(res, post);
  } catch (err) {
    next(err);
  }
}

export async function votePost(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw ApiError.unauthorized('Unauthorized');
    }
    const { id } = postIdParamSchema.parse(req.params);
    const result = await postsService.toggleVote(id, req.userId);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
