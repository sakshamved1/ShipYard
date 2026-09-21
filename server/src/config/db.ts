import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "./logger.js";

/**
 * Connects to MongoDB via Mongoose and sets up connection lifecycle event handlers.
 */
export async function connectDB(): Promise<void> {
  mongoose.connection.on("connected", () => {
    logger.info(`MongoDB connected successfully [${mongoose.connection.host}]`);
  });

  mongoose.connection.on("error", (err) => {
    logger.error(`MongoDB connection error: ${err.message}`, err);
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
  });

  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
  } catch (error) {
    logger.warn(
      `MongoDB connection warning: Could not connect to ${env.MONGODB_URI} (${(error as Error).message}). Ensure MongoDB is running.`
    );
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
