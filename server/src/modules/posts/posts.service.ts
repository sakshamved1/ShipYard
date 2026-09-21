import { Types } from 'mongoose';
import { Post } from './Post.js';
import { CreatePostInput, ListPostsQuery } from './posts.schemas.js';
import { ApiError } from '../../utils/ApiError.js';

export interface PostResponse {
  _id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  author: {
    _id: string;
    name: string;
  };
  voteCount: number;
  commentCount: number;
  hasVoted: boolean;
  statusHistory: Array<{
    status: string;
    changedBy: string;
    changedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

export async function listPosts(query: ListPostsQuery, currentUserId?: string) {
  const { page, limit, category, status, sort, q } = query;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (category) {
    filter.category = category;
  }
  if (status) {
    filter.status = status;
  }
  if (q && q.trim()) {
    const escaped = escapeRegex(q.trim());
    filter.$or = [
      { title: { $regex: escaped, $options: 'i' } },
      { description: { $regex: escaped, $options: 'i' } },
    ];
  }

  let sortOption: Record<string, 1 | -1> = { voteCount: -1, _id: -1 };
  if (sort === 'new') {
    sortOption = { createdAt: -1 };
  } else if (sort === 'oldest') {
    sortOption = { createdAt: 1 };
  } else if (sort === 'trending') {
    sortOption = { voteCount: -1, createdAt: -1 };
  }

  const [posts, total] = await Promise.all([
    Post.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate<{ author: { _id: Types.ObjectId; name: string } }>('author', '_id name')
      .lean()
      .exec(),
    Post.countDocuments(filter).exec(),
  ]);

  const totalPages = Math.ceil(total / limit);

  const formattedPosts: PostResponse[] = posts.map((post) => {
    const isVoted = currentUserId && post.voters
      ? post.voters.some((voterId) => voterId.toString() === currentUserId)
      : false;

    return {
      _id: post._id.toString(),
      title: post.title,
      description: post.description,
      category: post.category,
      status: post.status,
      author: {
        _id: post.author?._id ? post.author._id.toString() : '',
        name: post.author?.name ?? 'Anonymous',
      },
      voteCount: post.voteCount,
      commentCount: post.commentCount,
      hasVoted: isVoted,
      statusHistory: (post.statusHistory || []).map((sh) => ({
        status: sh.status,
        changedBy: sh.changedBy ? sh.changedBy.toString() : '',
        changedAt: sh.changedAt,
      })),
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  });

  return {
    posts: formattedPosts,
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

export async function createPost(userId: string, input: CreatePostInput) {
  const post = await Post.create({
    title: input.title,
    description: input.description,
    category: input.category,
    author: new Types.ObjectId(userId),
    status: 'under_review',
  });

  const populated = await Post.findById(post._id)
    .populate<{ author: { _id: Types.ObjectId; name: string } }>('author', '_id name')
    .lean()
    .exec();

  if (!populated) {
    throw ApiError.internal('Failed to create post');
  }

  return {
    _id: populated._id.toString(),
    title: populated.title,
    description: populated.description,
    category: populated.category,
    status: populated.status,
    author: {
      _id: populated.author._id.toString(),
      name: populated.author.name,
    },
    voteCount: populated.voteCount,
    commentCount: populated.commentCount,
    hasVoted: false,
    statusHistory: populated.statusHistory.map((sh) => ({
      status: sh.status,
      changedBy: sh.changedBy ? sh.changedBy.toString() : '',
      changedAt: sh.changedAt,
    })),
    createdAt: populated.createdAt,
    updatedAt: populated.updatedAt,
  };
}

export async function getPostById(postId: string, currentUserId?: string) {
  const post = await Post.findById(postId)
    .populate<{ author: { _id: Types.ObjectId; name: string } }>('author', '_id name')
    .lean()
    .exec();

  if (!post) {
    throw ApiError.notFound('Post not found');
  }

  const isVoted = currentUserId && post.voters
    ? post.voters.some((voterId) => voterId.toString() === currentUserId)
    : false;

  return {
    _id: post._id.toString(),
    title: post.title,
    description: post.description,
    category: post.category,
    status: post.status,
    author: {
      _id: post.author?._id ? post.author._id.toString() : '',
      name: post.author?.name ?? 'Anonymous',
    },
    voteCount: post.voteCount,
    commentCount: post.commentCount,
    hasVoted: isVoted,
    statusHistory: (post.statusHistory || []).map((sh) => ({
      status: sh.status,
      changedBy: sh.changedBy ? sh.changedBy.toString() : '',
      changedAt: sh.changedAt,
    })),
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}

export async function toggleVote(postId: string, userId: string) {
  const post = await Post.findById(postId);
  if (!post) {
    throw ApiError.notFound('Post not found');
  }

  const userObjId = new Types.ObjectId(userId);
  const alreadyVotedIndex = post.voters.findIndex((v) => v.equals(userObjId));

  let hasVoted: boolean;
  if (alreadyVotedIndex > -1) {
    post.voters.splice(alreadyVotedIndex, 1);
    post.voteCount = Math.max(0, post.voteCount - 1);
    hasVoted = false;
  } else {
    post.voters.push(userObjId);
    post.voteCount += 1;
    hasVoted = true;
  }

  await post.save();

  return {
    hasVoted,
    voteCount: post.voteCount,
  };
}
