import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'warn' : 'debug');
  const levels = logLevel === 'verbose' ? ['log', 'error', 'warn', 'debug', 'verbose'] as const : logLevel === 'debug' ? ['log', 'error', 'warn', 'debug'] as const : logLevel === 'warn' ? ['error', 'warn'] as const : ['log', 'error', 'warn'] as const;
  const app = await NestFactory.create(AppModule, { rawBody: true, logger: [...levels] as unknown as ("log" | "error" | "warn" | "debug" | "verbose")[] });

  // CORS whitelist — LOCALHOST DEV ONLY.
  // Sebelum production launch, tambahkan domain Vercel / Railway asli di sini.
  const allowedOrigins = [
    "http://localhost:3000", // Admin Frontend (Next.js)
    "http://localhost:3001", // Backend NestJS itu sendiri (redirect / self-test)
    "http://localhost:3002", // Alternate admin frontend
    "http://localhost:3003",
    "https://admin-mini-app-495y.vercel.app", // Admin Frontend on Vercel
    "https://mini-app-nine-mu.vercel.app",
  ];

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow curl / Postman / REST clients (no Origin header) for local debugging
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Allow any localhost / 127.0.0.1 port — fleksibel jika anda ganti port dev
      const host = new URL(origin).hostname;
      if (host === "localhost" || host === "127.0.0.1")
        return callback(null, true);
      return callback(
        new Error(
          `CORS blocked origin: ${origin} — tambahkan domain production di allowedOrigins sebelum launch`,
        ),
        false,
      );
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "Appid",
      "Timestamp",
      "Sign",
      "x-signature",
      "x-forwarded-for",
    ],
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  new Logger("Bootstrap").log(
    `✅ Backend listening on port ${port} — CORS whitelist LOCALHOST ONLY`,
  );
  new Logger("Bootstrap").log(
    `   Allowed origins (${allowedOrigins.length}): ${allowedOrigins.join(", ")}`,
  );
  new Logger("Bootstrap").log(
    `   ℹ️  Sebelum production launch: tambahkan domain Vercel/Railway di src/main.ts allowedOrigins`,
  );
}
bootstrap();
