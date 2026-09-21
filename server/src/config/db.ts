import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "./logger.js";

let isConnecting = false;

/**
 * Connects to MongoDB via Mongoose and sets up connection lifecycle event handlers.
 * Optimized for both long-running server and serverless (Vercel) environments.
 */
export async function connectDB(): Promise<void> {
  // Reuse existing connection if already connected
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // If already connecting, wait for connection to complete
  if (mongoose.connection.readyState === 2 || isConnecting) {
    let attempts = 0;
    while ((mongoose.connection.readyState === 2 || isConnecting) && attempts < 25) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      attempts++;
    }
    if ((mongoose.connection.readyState as number) === 1) return;
  }

  isConnecting = true;

  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
  } catch (error) {
    logger.warn(
      `MongoDB connection warning: Could not connect to ${env.MONGODB_URI} (${(error as Error).message}). Ensure MongoDB is running.`
    );
  } finally {
    isConnecting = false;
  }
}


/**
 * Closes the MongoDB connection gracefully.
 */
export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.connection.close();
    logger.info("MongoDB connection closed gracefully.");
  } catch (err) {
    logger.error("Error closing MongoDB connection:", err);
  }
}
