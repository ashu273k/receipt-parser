import { Router } from 'express';
import { saveReceipt, listReceipts } from '../db.js';

const receiptsRouter = Router();

// POST /api/receipts — save a reviewed/corrected receipt
receiptsRouter.post('/', (req, res) => {
  try {
    const body = req.body;

    // Basic validation
    if (!body.merchant || !body.date || body.total == null) {
      res.status(400).json({ error: 'merchant, date, and total are required.' });
      return;
    }

    const id = saveReceipt({
      merchant: body.merchant,
      date: body.date,
      currency: body.currency ?? 'USD',
      line_items: body.line_items ?? [],
      subtotal: body.subtotal ?? null,
      tax: body.tax ?? null,
      tip: body.tip ?? null,
      discount: body.discount ?? null,
      total: body.total,
      overall_confidence: body.overall_confidence ?? 'high',
    });

    res.status(201).json({ id });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save receipt.';
    console.error('[POST /api/receipts] Error:', message);
    res.status(500).json({ error: message });
  }
});

// GET /api/receipts — list all saved receipts, newest first
receiptsRouter.get('/', (_req, res) => {
  try {
    const receipts = listReceipts();
    res.json(receipts);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to list receipts.';
    console.error('[GET /api/receipts] Error:', message);
    res.status(500).json({ error: message });
  }
});

export default receiptsRouter;
