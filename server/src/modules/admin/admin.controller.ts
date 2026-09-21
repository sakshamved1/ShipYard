// src/modules/admin/admin.controller.ts
import { Request, Response, NextFunction } from 'express';
import { Post, IPost, PostStatus } from '../posts/Post.js';
import { Types } from 'mongoose';
import { ApiError } from '../../utils/ApiError.js';
import { adminPostsSchema, adminPatchStatusSchema, paginationSchema } from './schemas.js';
import { sendSuccess } from '../../utils/response.js';
import { AuthenticatedRequest } from '../auth/auth.middleware.js';

/** GET /admin/posts
 *  Filters: status, category, q (search title/description)
 *  Pagination: page, limit (max 50)
 *  Sort: field (e.g., voteCount, createdAt) and order (asc/desc)
 */
export async function getPosts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc', status, category, q } =
      paginationSchema.parse(req.query);

    if (limit > 50) {
      throw ApiError.badRequest('Limit cannot exceed 50');
    }

    const filter: any = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (q) {
      filter.$text = { $search: q };
    }

    const sortOption: any = {};
    sortOption[sort] = order === 'asc' ? 1 : -1;

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      Post.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);
    return sendSuccess(res, posts, 200, { page, limit, total, totalPages });
  } catch (err) {
    next(err);
  }
}

/** PATCH /admin/posts/:id/status */
export async function patchPostStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = adminPostsSchema.parse(req.params);
    const { status } = adminPatchStatusSchema.parse(req.body);

    // Validate status value
    const newStatus = status as PostStatus;

    // Find post and ensure it exists
    const post = await Post.findById(id);
    if (!post) {
      throw ApiError.notFound('Post not found');
    }

    if (post.status === newStatus) {
      throw ApiError.badRequest('No status change');
    }

    // Update status and push to history atomically
    post.status = newStatus;
    post.statusHistory.push({
      status: newStatus,
      changedBy: req.userId ? new Types.ObjectId(req.userId) : new Types.ObjectId(),
      changedAt: new Date(),
    });
    await post.save();

    return sendSuccess(res, post);
  } catch (err) {
    next(err);
  }
}

/** GET /admin/stats */
export async function getStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [statusCounts, totalPosts, totalVotes, recentPosts] = await Promise.all([
      Post.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Post.estimatedDocumentCount().exec(),
      Post.aggregate([{ $group: { _id: null, votes: { $sum: '$voteCount' } } }]),
      Post.countDocuments({ createdAt: { $gte: sevenDaysAgo } }).exec(),
    ]);

    const countsByStatus: Record<string, number> = {};
    statusCounts.forEach((item: any) => {
      countsByStatus[item._id] = item.count;
    });

    const totalVotesValue = totalVotes[0]?.votes ?? 0;

    return sendSuccess(res, {
      countsByStatus,
      totalPosts,
      totalVotes: totalVotesValue,
      postsLast7Days: recentPosts,
    });
  } catch (err) {
    next(err);
  }
}
