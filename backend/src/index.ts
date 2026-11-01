import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { snippetsRouter } from './routes/snippets';
import { tasksRouter } from './routes/tasks';

export const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRouter);
app.use('/api/snippets', snippetsRouter);
app.use('/api/tasks', tasksRouter);

if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`devflow-ai backend running on :${PORT}`));
}
