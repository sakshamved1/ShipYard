/**
 * Simple structured logger for ShipYard server.
 * Standardizes output formatting without polluting logs with uncontrolled console statements.
 */
export const logger = {
  info: (message: string, meta?: unknown) => {
    const timestamp = new Date().toISOString();
    if (meta !== undefined) {
      console.log(`[INFO] [${timestamp}] ${message}`, meta);
    } else {
      console.log(`[INFO] [${timestamp}] ${message}`);
    }
  },
  warn: (message: string, meta?: unknown) => {
    const timestamp = new Date().toISOString();
    if (meta !== undefined) {
      console.warn(`[WARN] [${timestamp}] ${message}`, meta);
    } else {
      console.warn(`[WARN] [${timestamp}] ${message}`);
    }
  },
  error: (message: string, meta?: unknown) => {
    const timestamp = new Date().toISOString();
    if (meta !== undefined) {
      console.error(`[ERROR] [${timestamp}] ${message}`, meta);
    } else {
      console.error(`[ERROR] [${timestamp}] ${message}`);
    }
  },
  debug: (message: string, meta?: unknown) => {
    if (process.env.NODE_ENV === "development") {
      const timestamp = new Date().toISOString();
      if (meta !== undefined) {
        console.debug(`[DEBUG] [${timestamp}] ${message}`, meta);
      } else {
        console.debug(`[DEBUG] [${timestamp}] ${message}`);
      }
    }
  },
};
