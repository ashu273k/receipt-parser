import { Router } from 'express';
import multer from 'multer';
import { extractReceipt } from '../gemini-client.js';

// ── Multer config ───────────────────────────────────────────────────────────

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG and PNG images are accepted.'));
    }
  },
});

// ── Router ──────────────────────────────────────────────────────────────────

const parseRouter = Router();

parseRouter.post(
  '/parse',
  upload.single('receipt'),
  async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No image file provided. Upload a JPEG or PNG as the "receipt" field.' });
        return;
      }

      const imageBase64 = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype;

      const result = await extractReceipt(imageBase64, mimeType);

      if (result.parseFailed) {
        res.status(200).json({ parseFailed: true, rawText: result.rawText });
        return;
      }

      res.status(200).json({ parseFailed: false, data: result.data });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred.';
      console.error('[POST /api/receipts/parse] Error:', message);
      res.status(500).json({ error: message });
    }
  },
);

export default parseRouter;
