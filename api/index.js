import { app } from "../server/dist/app.js";
import { connectDB } from "../server/dist/config/db.js";

/**
 * Vercel Serverless Function entrypoint.
 * Bridges incoming requests to the Express application after verifying DB connection.
 */
export default async function handler(req, res) {
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error("Serverless handler error:", error);
    res.status(500).json({
      error: {
        code: "SERVER_ERROR",
        message: "Internal server error occurred.",
      },
    });
  }
}
