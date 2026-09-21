import { app } from "./app.js";
import { env } from "./config/env.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { logger } from "./config/logger.js";
import { Server } from "http";

let server: Server;

async function bootstrap() {
  // Start HTTP listener
  server = app.listen(env.PORT, () => {
    logger.info(`🚀 ShipYard server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    logger.info(`🔗 Health check available at: http://localhost:${env.PORT}/api/v1/health`);
    logger.info(`🔗 Allowed CORS origin: ${env.CLIENT_URL}`);
  });

  // Connect to MongoDB database
  await connectDB();

  // Graceful shutdown signals
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    if (server) {
      server.close(async () => {
        logger.info("HTTP server closed.");
        await disconnectDB();
        process.exit(0);
      });

      // Force shutdown after timeout if pending connections don't close
      setTimeout(() => {
        logger.error("Could not close connections in time, forcefully shutting down.");
        process.exit(1);
      }, 10000);
    } else {
      process.exit(0);
    }
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

bootstrap().catch((err) => {
  logger.error("Failed to start server:", err);
  process.exit(1);
});
