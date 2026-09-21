import { Schema, model, Document, Types } from 'mongoose';

export interface IRefreshToken extends Document {
  user: Types.ObjectId;
  familyId: string; // Identifier for token family
  tokenHash: string; // SHA-256 hash of the raw token
  expiresAt: Date;
  revokedAt?: Date;
  replacedBy?: Types.ObjectId;
  userAgent?: string;
  ip?: string;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    familyId: { type: String, required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date },
    replacedBy: { type: Schema.Types.ObjectId, ref: 'RefreshToken' },
    userAgent: { type: String },
    ip: { type: String },
  },
  { timestamps: true }
);

// TTL index to automatically delete expired tokens
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
refreshTokenSchema.index({ familyId: 1 });

export const RefreshToken = model<IRefreshToken>('RefreshToken', refreshTokenSchema);
