/**
 * Custom application error carrying HTTP status code and standardized error code.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    code = "INTERNAL_SERVER_ERROR",
    details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, code = "BAD_REQUEST", details?: unknown): ApiError {
    return new ApiError(400, message, code, details);
  }

  static unauthorized(message = "Unauthorized", code = "UNAUTHORIZED"): ApiError {
    return new ApiError(401, message, code);
  }

  static forbidden(message = "Forbidden", code = "FORBIDDEN"): ApiError {
    return new ApiError(403, message, code);
  }

  static notFound(message = "Resource not found", code = "NOT_FOUND"): ApiError {
    return new ApiError(404, message, code);
  }

  static conflict(message: string, code = "CONFLICT"): ApiError {
    return new ApiError(409, message, code);
  }

  static tooManyRequests(message = "Too many requests", code = "TOO_MANY_REQUESTS"): ApiError {
    return new ApiError(429, message, code);
  }

  static internal(message = "Internal server error", code = "INTERNAL_SERVER_ERROR"): ApiError {
    return new ApiError(500, message, code);
  }
}
