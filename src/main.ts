import { NestFactory } from '@nestjs/core';
import * as cors from 'cors';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json, raw } from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('My API')
    .setDescription('API description')
    .setVersion('1.0')
    .addServer('/api')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  app.use(cookieParser());
  app.use(cors({ origin: '*' }));
  // app.use(express.raw({ type: '*/*' }));
  app.use((req, res, next) => {
    if (req.originalUrl === '/api/stripe/webhook') {
      raw({ type: 'application/json' })(req, res, next); // 👈 Use raw body here
    } else {
      json()(req, res, next);
    }
  });
  app.useGlobalPipes(new ValidationPipe());
  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
