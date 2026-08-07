import express from 'express';
import cors from 'cors';
import router from './routers';
import errorEnvelope from './middleware/errorEnvelope';
import { createRateLimiter } from './middleware/rateLimiter';

const app = express();

// Allow browser clients from an explicit origin allowlist (comma-separated CORS_ORIGIN, defaulting
// to the Vite dev server). Without this a browser SPA on another origin would be blocked by the
// same-origin policy; non-browser clients (Postman, the test suite) are unaffected either way.
const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim());

app.use(cors({ origin: allowedOrigins }));
// Wrap responses so every error comes back as { error: { message, details? } }. Mounted before the
// rate limiter so a 429 goes out in the same envelope as every other error.
app.use(errorEnvelope);
// Throttle writes by IP. Reads are exempt (cheap, public), and the whole thing is disabled under
// NODE_ENV=test so the suite — which fires far more than the cap in a single window/process — never
// trips it (the 429 path is covered directly in test/integration/rateLimit.test.ts instead).
app.use(
    createRateLimiter({
        skip: (req) =>
            process.env.NODE_ENV === 'test' ||
            req.method === 'GET' ||
            req.method === 'HEAD' ||
            req.method === 'OPTIONS',
    }),
);
app.use(express.json());
app.use('/api', router);

export default app;