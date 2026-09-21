// src/modules/posts/Post.ts
import { Schema, model, Document, Types } from 'mongoose';

export type PostCategory = 'UI/UX' | 'Integrations' | 'Performance' | 'General';
export type PostStatus = 'under_review' | 'planned' | 'in_progress' | 'completed';

export interface IStatusHistoryEntry {
  status: PostStatus;
  changedBy: Types.ObjectId; // user who changed status
  changedAt: Date;
}

export interface IPost extends Document {
  title: string;
  description: string; // markdown
  category: PostCategory;
  status: PostStatus;
  author: Types.ObjectId;
  voters: Types.ObjectId[];
  voteCount: number;
  commentCount: number;
  statusHistory: IStatusHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    title: { type: String, required: true, minlength: 5, maxlength: 120 },
    description: { type: String, required: true, minlength: 10, maxlength: 5000 },
    category: {
      type: String,
      enum: ['UI/UX', 'Integrations', 'Performance', 'General'],
      required: true,
    },
    status: {
      type: String,
      enum: ['under_review', 'planned', 'in_progress', 'completed'],
      default: 'under_review',
    },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    voters: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    voteCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    statusHistory: [
      {
        status: { type: String, enum: ['under_review', 'planned', 'in_progress', 'completed'], required: true },
        changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        changedAt: { type: Date, default: Date.now, required: true },
      },
    ],
  },
  { timestamps: true, toJSON: { virtuals: true } },
);

// Pre‑save hook to create initial statusHistory entry for new posts.
postSchema.pre<IPost>('save', function (next) {
  if (this.isNew) {
    this.statusHistory = [
      {
        status: this.status,
        changedBy: this.author,
        changedAt: new Date(),
      },
    ];
  }
  next();
});

// Indexes for feed, roadmap, and search
postSchema.index({ status: 1, voteCount: -1, _id: -1 });
postSchema.index({ voteCount: -1, _id: -1 });
postSchema.index({ category: 1, voteCount: -1 });
postSchema.index({ category: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ author: 1 });
postSchema.index({ title: 'text', description: 'text' }, { weights: { title: 10, description: 3 } });

export const Post = model<IPost>('Post', postSchema);
