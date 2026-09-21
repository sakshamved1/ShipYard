import { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, IUser } from '../users/User.js';
import { RefreshToken } from './RefreshToken.js';
import { generateAccessToken, generateRefreshToken, setAuthCookies, clearAuthCookies, verifyRefreshToken } from './token.helpers.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import crypto from 'crypto';

/**
 * Service layer for authentication related operations.
 * All functions throw ApiError on failure.
 */
export class AuthService {
  /** Register a new user and issue tokens */
  static async signup(name: string, email: string, password: string): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw ApiError.conflict('User already exists');
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email: email.toLowerCase(), passwordHash, role: 'user' });
    // For simplicity we mark email as verified (real flow would send verification email)
    user.isEmailVerified = true;
    await user.save();
    // Create tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const { token: refreshToken, tokenHash } = generateRefreshToken();
    await RefreshToken.create({
      user: user._id,
      familyId: crypto.randomUUID(),
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    const { passwordHash: _p, verificationTokenHash: _v, resetTokenHash: _r, ...safeUser } = user.toObject();
    return { accessToken, refreshToken, user: safeUser as any };
  }

  /** Verify credentials and issue tokens */
  static async login(email: string, password: string): Promise<{ accessToken: string; refreshToken: string; user: Omit<IUser, 'passwordHash' | 'verificationTokenHash' | 'resetTokenHash'> }> {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Generic error to avoid enumeration
      throw ApiError.unauthorized('Invalid credentials');
    }
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw ApiError.unauthorized('Invalid credentials');
    }
    const accessToken = generateAccessToken(user._id, user.role);
    const { token: refreshToken, tokenHash } = generateRefreshToken();
    await RefreshToken.create({
      user: user._id,
      familyId: crypto.randomUUID(),
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    const { passwordHash, verificationTokenHash, resetTokenHash, ...safeUser } = user.toObject();
    return { accessToken, refreshToken, user: safeUser as any };
  }

  /** Refresh access token using a valid refresh token */
  static async refresh(oldRefreshToken: string, userAgent?: string, ip?: string): Promise<{ accessToken: string; newRefreshToken: string }> {
    const tokenHash = crypto.createHash('sha256').update(oldRefreshToken).digest('hex');
    const stored = await RefreshToken.findOne({ tokenHash }).populate('user');
    if (!stored || stored.revokedAt) {
      // Invalidate entire family if reuse detected
      if (stored?.familyId) {
        await RefreshToken.updateMany({ familyId: stored.familyId }, { revokedAt: new Date() });
      }
      throw ApiError.unauthorized('Refresh token invalid');
    }
    // Rotate token
    const newToken = generateRefreshToken();
    stored.revokedAt = new Date();
    stored.replacedBy = undefined; // will be set after saving new token
    await stored.save();
    const newDoc = await RefreshToken.create({
      user: stored.user._id,
      familyId: stored.familyId,
      tokenHash: newToken.tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userAgent,
      ip,
    });
    // link replacement
    stored.replacedBy = newDoc._id;
    await stored.save();
    const user = stored.user as any;
    const accessToken = generateAccessToken(user._id, user.role);
    return { accessToken, newRefreshToken: newToken.token };
  }

  /** Logout – revoke all refresh tokens for the user */
  static async logout(userId: Types.ObjectId): Promise<void> {
    await RefreshToken.updateMany({ user: userId }, { revokedAt: new Date() });
  }
}
