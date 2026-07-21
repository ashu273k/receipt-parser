import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseReceiptJSON, validateReceipt, extractReceipt } from './gemini-client.js';

const generateContentMock = vi.fn();

vi.mock('@google/genai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@google/genai')>();
  return {
    ...actual,
    GoogleGenAI: class {
      models = { generateContent: generateContentMock };
    },
  };
});

const VALID_RECEIPT_JSON = `{
  "merchant": "Test Store",
  "date": "2024-01-15",
  "currency": "USD",
  "line_items": [{"name": "Widget", "amount": 9.99, "confidence": "high"}],
  "subtotal": 9.99,
  "tax": 0.80,
  "tip": null,
  "discount": null,
  "total": 10.79,
  "overall_confidence": "high"
}`;

const VALID_RECEIPT_OBJ = JSON.parse(VALID_RECEIPT_JSON);

describe('gemini-client', () => {
  describe('parseReceiptJSON / validateReceipt', () => {
    it('should pass through valid JSON matching the schema', () => {
      const result = parseReceiptJSON(VALID_RECEIPT_JSON);
      expect(result).toEqual(VALID_RECEIPT_OBJ);
    });

    it('should throw on invalid JSON', () => {
      expect(() => parseReceiptJSON('this is not json')).toThrow(/Unexpected token/);
    });

    it('should throw if required fields are missing', () => {
      const invalidObj = { ...VALID_RECEIPT_OBJ };
      delete invalidObj.merchant;
      expect(() => validateReceipt(invalidObj)).toThrow(/Missing\/invalid merchant/);
      expect(() => parseReceiptJSON(JSON.stringify(invalidObj))).toThrow(/Missing\/invalid merchant/);
    });
  });

  describe('extractReceipt', () => {
    beforeEach(() => {
      process.env.GEMINI_API_KEY = 'test-key';
      generateContentMock.mockReset();
    });

    it('should return parsed receipt if first try returns valid JSON', async () => {
      generateContentMock.mockResolvedValueOnce({ text: VALID_RECEIPT_JSON });

      const result = await extractReceipt('base64', 'image/png');
      expect(generateContentMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ parseFailed: false, data: VALID_RECEIPT_OBJ });
    });

    it('should return parsed receipt if first try is invalid but retry is valid', async () => {
      generateContentMock
        .mockResolvedValueOnce({ text: 'invalid json' })
        .mockResolvedValueOnce({ text: VALID_RECEIPT_JSON });

      const result = await extractReceipt('base64', 'image/png');
      expect(generateContentMock).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ parseFailed: false, data: VALID_RECEIPT_OBJ });
    });

    it('should return parseFailed: true if both tries are invalid', async () => {
      generateContentMock
        .mockResolvedValueOnce({ text: 'invalid json 1' })
        .mockResolvedValueOnce({ text: 'invalid json 2' });

      const result = await extractReceipt('base64', 'image/png');
      expect(generateContentMock).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ parseFailed: true, rawText: 'invalid json 2' });
    });
  });
});
