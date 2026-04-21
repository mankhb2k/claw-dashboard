export class Logger {
  constructor(private module: string) {}

  log(message: string, data?: any) {
    console.log(`[${new Date().toISOString()}] [${this.module}] ${message}`, data ? JSON.stringify(data) : '');
  }

  error(message: string, err?: any) {
    console.error(`[${new Date().toISOString()}] [${this.module}] ERROR: ${message}`, err instanceof Error ? err.message : err);
  }

  warn(message: string, data?: any) {
    console.warn(`[${new Date().toISOString()}] [${this.module}] WARN: ${message}`, data ? JSON.stringify(data) : '');
  }

  debug(message: string, data?: any) {
    if (process.env.DEBUG) {
      console.debug(`[${new Date().toISOString()}] [${this.module}] DEBUG: ${message}`, data ? JSON.stringify(data) : '');
    }
  }
}
