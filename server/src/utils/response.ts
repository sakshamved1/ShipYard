import { Response } from "express";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponseEnvelope<T> {
  data: T;
  meta?: PaginationMeta | Record<string, unknown>;
}

export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Sends a standardized JSON success response: { data, meta? }
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: PaginationMeta | Record<string, unknown>
): Response {
  const payload: ApiResponseEnvelope<T> = { data };
  if (meta !== undefined) {
    payload.meta = meta;
  }
  return res.status(statusCode).json(payload);
}

/**
 * Sends a standardized JSON error response: { error: { code, message, details? } }
 */
export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown
): Response {
  const payload: ApiErrorEnvelope = {
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };
  return res.status(statusCode).json(payload);
}
