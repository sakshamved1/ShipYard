import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError.js";
import { sendError } from "../utils/response.js";
import { logger } from "../config/logger.js";
import { env } from "../config/env.js";

/**
 * Central error handling middleware.
 * Formats all errors into { error: { code, message, details? } }
 * and conceals internal implementation details in production.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // Operational ApiError
  if (err instanceof ApiError) {
    if (err.statusCode >= 500) {
      logger.error(`[ApiError ${err.statusCode}] ${err.message}`, err);
    }
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    const formattedErrors = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    sendError(
      res,
      400,
      "VALIDATION_ERROR",
      "Invalid request input",
      formattedErrors
    );
    return;
  }

  // Syntax error from bad JSON payload
  if (err instanceof SyntaxError && "status" in err && err.status === 400 && "body" in err) {
    sendError(res, 400, "BAD_REQUEST", "Malformed JSON body in request");
    return;
  }

  // Mongoose duplicate key error (11000)
  if (err && typeof err === "object" && "code" in err && err.code === 11000) {
    const keyPattern = (err as { keyPattern?: Record<string, unknown> }).keyPattern;
    const field = keyPattern ? Object.keys(keyPattern)[0] : "Resource";
    sendError(
      res,
      409,
      "CONFLICT",
      `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`
    );
    return;
  }

  // Unhandled / server errors
  logger.error("Unhandled error encountered:", err);

  const isProd = env.NODE_ENV === "production";
  const message = isProd ? "Internal server error" : (err?.message || "Internal server error");
  const details = isProd ? undefined : { stack: err?.stack };

  sendError(res, 500, "INTERNAL_SERVER_ERROR", message, details);
};
