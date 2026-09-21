import { Types, startSession } from 'mongoose';
import { Comment, IComment } from './Comment.js';
import { Post } from '../posts/Post.js';
import { ApiError } from '../../utils/ApiError.js';
import { AuthenticatedRequest } from '../../modules/auth/auth.middleware.js';

/**
 * Fetch paginated top‑level comments for a post and return meta information.
 */
export async function getTopLevelComments(
  postId: string,
  page: number,
  limit: number,
  sort: 'oldest' | 'newest'
) {
  const skip = (page - 1) * limit;
  const sortOption: any = { createdAt: sort === 'newest' ? -1 : 1 };

  const [comments, total] = await Promise.all([
    Comment.find({ post: postId, parent: null })
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    Comment.countDocuments({ post: postId, parent: null }).exec(),
  ]);

  const totalPages = Math.ceil(total / limit);

  return { comments, meta: { page, limit, total, totalPages } };
}

/** Fetch all replies for a set of root comment IDs */
export async function getReplies(rootIds: Types.ObjectId[]) {
  return Comment.find({ root: { $in: rootIds } })
    .sort({ createdAt: 1 })
    .lean()
    .exec();
}

/** Create a new comment, atomically increment post commentCount */
export async function createComment(
  userId: string,
  postId: string,
  body: string,
  parentId?: string
) {
  // Validate parent if supplied
  let depth = 0;
  let rootId: Types.ObjectId | null = null;

  if (parentId) {
    const parent = await Comment.findById(parentId).exec();
    if (!parent) throw ApiError.badRequest('Parent comment not found');
    if (!parent.post.equals(postId))
      throw ApiError.badRequest('Parent comment belongs to a different post');
    if (parent.depth >= 3)
      throw ApiError.badRequest('Maximum comment depth reached');
    depth = parent.depth + 1;
    rootId = parent.root ? parent.root : parent._id;
  }

  // Use transaction to ensure comment creation and commentCount increment are atomic
  const session = await startSession();
  let createdComment: IComment | null = null;
  try {
    await session.withTransaction(async () => {
      const commentDoc = await Comment.create(
        [
          {
            post: postId,
            author: userId,
            body,
            parent: parentId ?? null,
            root: rootId,
            depth,
            isDeleted: false,
          } as unknown as IComment,
        ],
        { session }
      );
      createdComment = commentDoc[0];
      await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } }, { session }).exec();
    });
    return createdComment!;
  } finally {
    await session.endSession();
  }
}

/** Update comment body, only author or admin */
export async function updateComment(
  req: AuthenticatedRequest,
  commentId: string,
  body: string
) {
  const comment = await Comment.findById(commentId).exec();
  if (!comment) throw ApiError.notFound('Comment not found');
  if (comment.isDeleted) throw ApiError.badRequest('Cannot edit a deleted comment');

  const isAdmin = req.role === 'admin';
  const isAuthor = comment.author.equals(req.userId);
  if (!isAdmin && !isAuthor) throw ApiError.forbidden('Access denied');

  comment.body = body;
  comment.editedAt = new Date();
  await comment.save();
  return comment;
}

/** Delete comment – soft delete if it has children, else remove */
export async function deleteComment(
  req: AuthenticatedRequest,
  commentId: string
) {
  const comment = await Comment.findById(commentId).exec();
  if (!comment) throw ApiError.notFound('Comment not found');

  const isAdmin = req.role === 'admin';
  const isAuthor = comment.author.equals(req.userId);
  if (!isAdmin && !isAuthor) throw ApiError.forbidden('Access denied');

  // Use transaction to ensure deletion (soft or hard) and commentCount decrement are atomic
  const session = await startSession();
  try {
    await session.withTransaction(async () => {
      const hasChildren = await Comment.findOne({ parent: commentId }).session(session).select('_id').lean().exec();

      if (hasChildren) {
        // Soft delete
        comment.isDeleted = true;
        comment.body = '[deleted]';
        await comment.save({ session });
      } else {
        await comment.deleteOne({ session });
      }

      // Decrement commentCount atomically
      await Post.findByIdAndUpdate(comment.post, { $inc: { commentCount: -1 } }, { session }).exec();
    });
    return { success: true };
  } finally {
    await session.endSession();
  }
}

/** Admin bulk delete – soft delete each comment */
export async function bulkDeleteComments(adminReq: AuthenticatedRequest, ids: string[]) {
  if (adminReq.role !== 'admin') throw ApiError.forbidden('Access denied');
  const objectIds = ids.map((id) => new Types.ObjectId(id));
  await Comment.updateMany(
    { _id: { $in: objectIds } },
    { $set: { isDeleted: true, body: '[deleted]' } }
  ).exec();
  // Recalculate commentCount for affected posts (simple approach)
  const posts = await Comment.distinct('post', { _id: { $in: objectIds } }).exec();
  for (const postId of posts) {
    const count = await Comment.countDocuments({ post: postId, isDeleted: false }).exec();
    await Post.findByIdAndUpdate(postId, { commentCount: count }).exec();
  }
  return { deletedCount: ids.length };
}
