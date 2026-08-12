"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:3003',
        'https://admin-mini-app-495y.vercel.app',
        'https://mini-app-nine-mu.vercel.app'
    ];
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin)
                return callback(null, true);
            if (allowedOrigins.includes(origin))
                return callback(null, true);
            const host = new URL(origin).hostname;
            if (host === 'localhost' || host === '127.0.0.1')
                return callback(null, true);
            return callback(new Error(`CORS blocked origin: ${origin} — tambahkan domain production di allowedOrigins sebelum launch`), false);
        },
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'Accept',
            'Appid',
            'Timestamp',
            'Sign',
            'x-signature',
            'x-forwarded-for'
        ]
    });
    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`✅ Backend listening on port ${port} — CORS whitelist LOCALHOST ONLY`);
    console.log(`   Allowed origins (${allowedOrigins.length}): ${allowedOrigins.join(', ')}`);
    console.log(`   ℹ️  Sebelum production launch: tambahkan domain Vercel/Railway di src/main.ts allowedOrigins`);
}
bootstrap();
//# sourceMappingURL=main.js.map