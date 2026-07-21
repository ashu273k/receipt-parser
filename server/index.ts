import 'dotenv/config';
import express from 'express';
import { initDb } from './db.js';
import parseRouter from './routes/parse.js';
import receiptsRouter from './routes/receipts.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// ── Database ────────────────────────────────────────────────────────────────

initDb();

// ── Routes ──────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ status: 'API OK' });
});

app.use('/api/receipts', parseRouter);
app.use('/api/receipts', receiptsRouter);

// ── Start ───────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

