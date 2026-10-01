import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser = require('cookie-parser');
import { join, extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { setDefaultResultOrder } from 'dns';
import express = require('express');
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { SafeHttpExceptionFilter } from './common/safe-http-exception.filter';
import { securityHeadersMiddleware } from './common/security-headers.middleware';

// Prefer IPv4 for outbound HTTPS (avoids intermittent undici "fetch failed"
// when IPv6 routes are broken or flaky on Windows).
try {
  setDefaultResultOrder('ipv4first');
} catch {
  /* Node < 17 — ignore */
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });
  app.use(cookieParser());
  app.use(securityHeadersMiddleware);
  app.useGlobalFilters(new SafeHttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  const uploadsDir =
    process.env.UPLOADS_DIR || join(process.cwd(), 'storage', 'uploads');
  if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });
  // Serve product images only — deny non-image extensions at the static layer
  const imageExt = new Set(['.jpg', '.jpeg', '.png', '.webp']);
  app.use(
    '/uploads',
    (req: Request, res: Response, next: NextFunction) => {
      const ext = extname(req.path).toLowerCase();
      if (ext && !imageExt.has(ext)) {
        res.status(404).end();
        return;
      }
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      next();
    },
    express.static(uploadsDir, {
      index: false,
      dotfiles: 'deny',
      fallthrough: false,
    }),
  );

  const origin =
    process.env.CORS_ORIGIN?.split(',').map((s) => s.trim()).filter(Boolean) ??
    ['http://localhost:3000'];
  app.enableCors({
    origin,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
}
bootstrap();
