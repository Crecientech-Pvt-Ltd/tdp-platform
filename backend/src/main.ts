import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as compression from 'compression';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.enableCors({
    origin: (requestOrigin, callback) => {
      if (configService.get('NODE_ENV', 'development') === 'production') {
        const FRONTEND_URL = configService.get('FRONTEND_URL');
        if (!FRONTEND_URL || requestOrigin === FRONTEND_URL) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    methods: 'GET, POST',
  });
  app.use(compression());
  app.use(cookieParser());
  await app.listen(process.env.PORT || 3000);
}
bootstrap()
  .then(() =>
    Logger.log(`Server started on ${process.env.PORT ?? 4000}`, 'Bootstrap'),
  )
  .catch((e) => {
    Logger.error(`❌  Error starting server. \n ${e}`);
    process.exit(1);
  });
