// src/modules/roadmap/roadmap.controller.ts
import { Response, NextFunction } from 'express';
import { Post, PostStatus } from '../posts/Post.js';
import { sendSuccess } from '../../utils/response.js';
import { AuthenticatedRequest } from '../auth/auth.middleware.js';

/** GET /roadmap
 *  Public endpoint returning columns: planned, in_progress, completed
 *  Each column sorted by voteCount desc, limited to 50 items.
 *  Returns per‑column total counts and optional hasVoted status.
 */
export async function getRoadmap(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const statuses: PostStatus[] = ['planned', 'in_progress', 'completed'];
    const limit = 50;
    const userId = req.userId;

    const results = await Promise.all(
      statuses.map(async (status) => {
        const posts = await Post.find({ status })
          .sort({ voteCount: -1, updatedAt: -1 })
          .limit(limit)
          .select('_id title category voteCount commentCount updatedAt voters')
          .lean()
          .exec();
        const total = await Post.countDocuments({ status }).exec();
        return { status, posts, total };
      })
    );

    const response: Record<string, any> = {};
    results.forEach((r) => {
      response[r.status] = {
        items: r.posts.map((p: any) => ({
          id: p._id.toString(),
          title: p.title,
          category: p.category,
          voteCount: p.voteCount,
          commentCount: p.commentCount,
          updatedAt: p.updatedAt,
          hasVoted: userId && p.voters ? p.voters.some((v: any) => v.toString() === userId) : false,
        })),
        total: r.total,
      };
    });

    // Set short‑lived cache control (15 seconds)
    res.setHeader('Cache-Control', 'public, max-age=15');
    return sendSuccess(res, response);
  } catch (err) {
    next(err);
  }
}
