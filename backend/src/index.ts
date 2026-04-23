import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import metricsRouter from './routes/metrics';
import subscriptionsRouter from './routes/subscriptions';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/metrics', metricsRouter);
app.use('/api/subscriptions', subscriptionsRouter);

app.listen(PORT, () => {
  console.log(`SurfGuru Dashboard API rodando em http://localhost:${PORT}`);
});
