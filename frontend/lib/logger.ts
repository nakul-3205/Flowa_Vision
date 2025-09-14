// lib/logger.ts
import { prisma } from './prisma';
import { LogLevel } from './generated/prisma';

type Metadata = Record<string, any> | null;

class Logger {
private service: string;

constructor(serviceName: string) {
this.service = serviceName;
}

private async write(level: LogLevel, message: string, metadata?: Metadata) {

prisma.log.create({
    data: {
    level,
    service: this.service,
    message,
    metadata: metadata || {},
    },
}).catch((err) => {
    console.error(`[Logger Error] Failed to log:`, err);
});
}

info(message: string, metadata?: Metadata) {
this.write(LogLevel.INFO, message, metadata);
}

warn(message: string, metadata?: Metadata) {
this.write(LogLevel.WARN, message, metadata);
}

error(message: string, metadata?: Metadata) {
this.write(LogLevel.ERROR, message, metadata);
}

debug(message: string, metadata?: Metadata) {
this.write(LogLevel.DEBUG, message, metadata);
}

// Universal log method
log(message: string, level: LogLevel = LogLevel.INFO, metadata?: Metadata) {
this.write(level, message, metadata);
}
}

// Factory function to create logger for each service/module
export const createLogger = (serviceName: string) => new Logger(serviceName);
