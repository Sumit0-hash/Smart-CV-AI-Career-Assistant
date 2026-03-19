import cors from 'cors';
import express from 'express';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';
import mockInterviewRoutes from './routes/mockInterviewRoutes.js';

const app = express();

app.use(
  cors({
    origin: env.allowedOrigin,
  }),
);
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/mock-interviews', mockInterviewRoutes);

app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({ message: 'Unexpected server error.' });
});

async function bootstrap() {
  await connectDatabase();
  app.listen(env.port, () => {
    console.log(`Mock Interview API listening on port ${env.port}`);
  });
}

void bootstrap();
