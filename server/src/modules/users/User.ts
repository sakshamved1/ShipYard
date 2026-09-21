import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  isEmailVerified: boolean;
  verificationTokenHash?: string;
  verificationTokenExpires?: Date;
  resetTokenHash?: string;
  resetTokenExpires?: Date;
  createdAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isEmailVerified: { type: Boolean, default: false },
    verificationTokenHash: { type: String },
    verificationTokenExpires: { type: Date },
    resetTokenHash: { type: String },
    resetTokenExpires: { type: Date },
    createdAt: { type: Date, default: Date.now },
  },
  {
    toJSON: {
      transform: (_, ret: any) => {
        delete ret.passwordHash;
        delete ret.verificationTokenHash;
        delete ret.resetTokenHash;
        return ret;
      },
    },
  }
);

export const User = model<IUser>('User', userSchema);
