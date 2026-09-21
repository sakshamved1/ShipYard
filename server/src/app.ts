import express, { Express } from "express";
import compression from "compression";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import { sendSuccess } from "./utils/response.js";
import { apiRateLimiter } from "./middleware/rateLimiters.js";

// Feature module routers
import authRouter from "./modules/auth/auth.controller.js";
import postsRouter from "./modules/posts/index.js";
import commentsRouter from "./modules/comments/index.js";
import adminRouter from "./modules/admin/index.js";
import roadmapRouter from "./modules/roadmap/index.js";

export function createApp(): Express {
  const app = express();

  // Performance: Compression middleware (gzip / deflate responses)
  app.use(compression());

  // Security Headers
  app.use(helmet());

  // CORS Configuration with credentials and flexible origin allow-list
  const allowedOrigins = [
    env.CLIENT_URL,
    "http://localhost:5173",
    "http://localhost:5000",
    "http://localhost:3000",
  ].filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, same-origin serverless)
        if (!origin) {
          return callback(null, true);
        }
        if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // Request Body Parsers (10kb payload limit to prevent DoS)
  app.use(express.json({ limit: "10kb" }));
  app.use(express.urlencoded({ extended: true, limit: "10kb" }));

  // Cookie Parser for httpOnly auth tokens
  app.use(cookieParser());

  // Development HTTP Request Logger
  if (env.NODE_ENV === "development") {
    app.use(morgan("dev"));
  }

  // Base API v1 router
  const apiRouter = express.Router();
  apiRouter.use(apiRateLimiter);

  // Health check endpoint
  apiRouter.get("/health", (_req, res) => {
    sendSuccess(res, { status: "ok" });
  });

  // Mount feature modules under /api/v1
  apiRouter.use("/auth", authRouter);
  apiRouter.use("/posts", postsRouter);
  apiRouter.use("/admin", adminRouter);
  apiRouter.use("/roadmap", roadmapRouter);

  // Mount API v1 router
  app.use("/api/v1", apiRouter);

  // Register comments router directly on /api/v1 (paths: /api/v1/posts/:postId/comments, /api/v1/comments/:id)
  app.use("/api/v1", commentsRouter);

  // Also support /roadmap directly if requested
  app.use("/roadmap", roadmapRouter);

  // 404 Handler
  app.use(notFound);

  // Central Error Handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
