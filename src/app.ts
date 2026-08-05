import express from 'express';
import cors from 'cors';
import router from './routers';
import errorEnvelope from './middleware/errorEnvelope';

const app = express();

// Allow browser clients from an explicit origin allowlist (comma-separated CORS_ORIGIN, defaulting
// to the Vite dev server). Without this a browser SPA on another origin would be blocked by the
// same-origin policy; non-browser clients (Postman, the test suite) are unaffected either way.
const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim());

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
// Wrap responses so every error comes back as { error: { message, details? } }.
app.use(errorEnvelope);
app.use('/api', router);

export default app;