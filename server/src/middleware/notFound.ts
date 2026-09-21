import { RequestHandler } from "express";
import { ApiError } from "../utils/ApiError.js";

/**
 * 404 Route Not Found middleware.
 */
export const notFound: RequestHandler = (req, _res, next) => {
  next(ApiError.notFound(`Cannot ${req.method} ${req.originalUrl}`));
};
