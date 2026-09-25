import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/**
 * Stage 09 — production-safe error responses.
 * Never leak stack traces, Prisma internals, filesystem paths, or secrets to clients.
 */
@Catch()
export class SafeHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SafeHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const isProd = process.env.NODE_ENV === 'production';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'An unexpected error occurred.';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
        error = exception.name;
      } else if (body && typeof body === 'object') {
        const obj = body as Record<string, unknown>;
        message =
          (obj.message as string | string[]) ??
          exception.message ??
          'Request failed.';
        error = (obj.error as string) ?? exception.name;
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `${req.method} ${req.url} — ${exception.message}`,
        isProd ? undefined : exception.stack,
      );
      if (!isProd && this.isPrismaLike(exception)) {
        message = 'Database request failed.';
        error = 'Bad Request';
        status = HttpStatus.BAD_REQUEST;
      }
    } else {
      this.logger.error(`${req.method} ${req.url} — unknown error`);
    }

    if (status >= 500 && isProd) {
      message = 'An unexpected error occurred.';
      error = 'Internal Server Error';
    }

    // Strip accidental stack / path leakage from message bodies
    const safeMessage = this.sanitizeMessage(message);

    res.status(status).json({
      statusCode: status,
      message: safeMessage,
      error,
    });
  }

  private isPrismaLike(err: Error): boolean {
    const name = err.name ?? '';
    return (
      name.startsWith('Prisma') ||
      /prisma|sqlite|postgres/i.test(err.message ?? '')
    );
  }

  private sanitizeMessage(message: string | string[]): string | string[] {
    const scrub = (s: string) => {
      let out = s;
      // Avoid dumping absolute Windows/Unix paths
      out = out.replace(/[A-Za-z]:\\[^\s]+/g, '[path]');
      out = out.replace(/\/(?:Users|home|var|tmp|app)\/[^\s]+/g, '[path]');
      out = out.replace(/\bpassword\b\s*[:=]\s*\S+/gi, 'password=[redacted]');
      out = out.replace(/\bBearer\s+\S+/gi, 'Bearer [redacted]');
      return out;
    };
    return Array.isArray(message) ? message.map(scrub) : scrub(message);
  }
}
