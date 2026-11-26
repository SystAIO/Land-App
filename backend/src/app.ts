import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import config from './config';
import { generalLimiter } from './middleware/rateLimit';

import authRouter from './routes/auth';
import listingsRouter from './routes/listings';
import favoritesRouter from './routes/favorites';
import paymentsRouter, { webhookHandler } from './routes/payments';
import adminRouter from './routes/admin';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));

// Razorpay webhook needs raw body for signature verification
app.post('/payments/webhook', express.raw({ type: 'application/json' }), webhookHandler);

app.use(express.json({ limit: '2mb' }));
app.use(generalLimiter);

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'systio-land', uptime: process.uptime() });
});

app.use('/auth', authRouter);
app.use('/listings', listingsRouter);
app.use('/favorites', favoritesRouter);
app.use('/', paymentsRouter); // exposes /listings/:id/submit, /payments/verify, /payments/history
app.use('/admin', adminRouter);

// 404 + error handler
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use(
  (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
);

export default app;
