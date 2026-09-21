import rateLimit from "express-rate-limit";
import { ApiError } from "../utils/ApiError.js";

/**
 * Strict rate limiter for authentication routes (login, register, forgot-password).
 * Prevents brute force and credential stuffing attacks.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 auth attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(
      ApiError.tooManyRequests(
        "Too many authentication attempts from this IP, please try again after 15 minutes."
      )
    );
  },
});

/**
 * General API rate limiter for standard public endpoints.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(
      ApiError.tooManyRequests("Rate limit exceeded, please try again later.")
    );
  },
});

/**
 * Rate limiter for voting endpoints – prevents rapid up‑vote/down‑vote spam.
 * Limit: 5 requests per 10 seconds per IP.
 */
export const voteRateLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(ApiError.tooManyRequests('Too many voting attempts, please slow down.'));
  },
});

/**
 * Rate limiter for comment creation/modification endpoints – prevents spam.
 * Limit: 5 requests per 10 seconds per IP.
 */
export const commentRateLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(ApiError.tooManyRequests('Too many comment actions, please slow down.'));
  },
});

/**
 * Rate limiter for post creation – prevents spam submissions.
 * Limit: 10 requests per minute per IP.
 */
export const postRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(ApiError.tooManyRequests('Too many post creations, please wait a minute.'));
  },
});
