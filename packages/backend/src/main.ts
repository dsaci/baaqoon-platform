import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from packages/backend/.env or root .env
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS with bulletproof origin reflection for Vercel and local environments
  const allowedOrigins = [
    "https://baaqoon-platform.vercel.app",
    "https://baaqoon.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
  ];
  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL.replace(/\/$/, ""));
  }

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const originNorm = origin.trim().toLowerCase();
      const isAllowed =
        allowedOrigins.some((o) => o.toLowerCase() === originNorm) ||
        originNorm.endsWith(".vercel.app");
      if (isAllowed) {
        callback(null, origin);
      } else {
        callback(null, origin);
      }
    },
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: "Content-Type,Accept,Authorization,X-Requested-With",
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global API Prefix
  app.setGlobalPrefix("api/v1");

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(
    `🚀 Baaqoon Platform Backend is running on: http://localhost:${port}/api/v1`,
  );
}
bootstrap();
 
