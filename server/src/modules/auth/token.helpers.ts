import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Types } from 'mongoose';
import { Request, Response } from 'express';
import { env } from '../../config/env.js';
import { RefreshToken } from './RefreshToken.js';
import { ApiError } from '../../utils/ApiError.js';

/** Generate a signed JWT access token */
export function generateAccessToken(userId: Types.ObjectId, role: 'user' | 'admin'): string {
  const payload = { sub: userId.toHexString(), role };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.ACCESS_TOKEN_TTL as any });
}

/** Generate a raw refresh token and its SHA‑256 hash */
export function generateRefreshToken(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(48).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, tokenHash };
}

/** Verify raw token against stored hash using timing safe compare */
export function verifyRefreshToken(rawToken: string, storedHash: string): boolean {
  const rawHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const bufA = Buffer.from(rawHash, 'hex');
  const bufB = Buffer.from(storedHash, 'hex');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Set auth cookies with consistent flags */
export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  const cookieOpts = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: env.NODE_ENV === 'production',
    path: '/',
    maxAge: 15 * 60 * 1000,
  };
  res.cookie('accessToken', accessToken, cookieOpts);

  const refreshOpts = {
    ...cookieOpts,
    path: '/api/v1/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
  res.cookie('refreshToken', refreshToken, refreshOpts);
}

/** Clear auth cookies */
export function clearAuthCookies(res: Response): void {
  const opts = { httpOnly: true, sameSite: 'lax' as const, secure: env.NODE_ENV === 'production', path: '/' };
  res.clearCookie('accessToken', opts);
  res.clearCookie('refreshToken', { ...opts, path: '/api/v1/auth' });
}

/** Verify JWT access token and return payload */
export function verifyAccessToken(token: string): { sub: string; role: 'user' | 'admin' } {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as { sub: string; role: 'user' | 'admin' };
    return payload;
  } catch (err) {
    throw ApiError.unauthorized('Invalid access token');
  }
}
