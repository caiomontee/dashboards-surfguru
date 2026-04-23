import express from 'express';
import cors from 'cors';
import metricsRouter from './routes/metrics';
import subscriptionsRouter from './routes/subscriptions';

// Fábrica do app Express compartilhada entre:
//  - servidor local (backend/src/index.ts → app.listen)
//  - função serverless da Vercel (api/index.ts → export default)
export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.use('/api/metrics', metricsRouter);
  app.use('/api/subscriptions', subscriptionsRouter);

  return app;
}
