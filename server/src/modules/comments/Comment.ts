import { Schema, model, Document, Types } from 'mongoose';

export interface IComment extends Document {
  post: Types.ObjectId;
  author: Types.ObjectId;
  body: string;
  parent?: Types.ObjectId | null;
  root?: Types.ObjectId | null;
  depth: number;
  isDeleted: boolean;
  editedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true },
    parent: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
    root: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
    depth: { type: Number, required: true, min: 0 },
    isDeleted: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Indexes for efficient queries
commentSchema.index({ post: 1, root: 1, createdAt: 1 });
commentSchema.index({ parent: 1 });

// Pre‑save hook to compute root and depth, and enforce max depth (3)
commentSchema.pre<IComment>('save', function (next) {
  if (this.parent) {
    // When there is a parent, fetch it to compute root and depth
    this.model('Comment')
      .findById(this.parent)
      .then((parentDoc: any) => {
        if (!parentDoc) {
          return next(new Error('Parent comment not found'));
        }
        // Ensure parent belongs to the same post
        if (!parentDoc.post.equals(this.post)) {
          return next(new Error('Parent comment belongs to a different post'));
        }
        this.root = parentDoc.root ? parentDoc.root : parentDoc._id;
        this.depth = parentDoc.depth + 1;
        if (this.depth > 3) {
          return next(new Error('Maximum comment depth reached'));
        }
        next();
      })
      .catch((err) => next(err));
  } else {
    // Top‑level comment
    this.root = null;
    this.depth = 0;
    next();
  }
});

export const Comment = model<IComment>('Comment', commentSchema);
