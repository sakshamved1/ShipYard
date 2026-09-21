import { Request, Response, NextFunction, RequestHandler } from "express";
import { AnyZodObject, ZodError } from "zod";

interface RequestValidators {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}

/**
 * Validates request body, query parameters, and/or path parameters using Zod schemas.
 */
export function validate(schemas: RequestValidators): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(error);
      } else {
        next(error);
      }
    }
  };
}
