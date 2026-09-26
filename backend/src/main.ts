import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AppConfig } from './config/configuration';
import { assertAllRoutesDeclarePermissions } from './common/startup/route-audit';
import { PinoLoggerService } from './common/logging/pino-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(PinoLoggerService));

  const config = app.get(ConfigService<AppConfig, true>);

  // NFR-04: security headers (HSTS, no-sniff, frame-deny, etc.) - TLS itself is terminated
  // upstream of this process (load balancer/reverse proxy), not configured here.
  app.use(helmet());
  app.use(cookieParser());
  // NFR-04: an explicit allowlist (CORS_ORIGINS), never a wildcard - reflecting any origin
  // while credentials:true is enabled would let any website make authenticated requests
  // using a logged-in user's session cookie.
  const corsOrigins = config.get('corsOrigins', { infer: true });
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Phase 0 exit criterion: refuse to start if any route is missing a permission declaration.
  await assertAllRoutesDeclarePermissions(app);

  const port = config.get('port', { infer: true });
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`garment-erp-api listening on :${port} (${config.get('nodeEnv', { infer: true })})`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal error during bootstrap:', err);
  process.exit(1);
});
