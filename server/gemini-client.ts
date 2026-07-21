import { GoogleGenAI, Type } from '@google/genai';
import type { GenerateContentResponse } from '@google/genai';

// ── Types ────────────────────────────────────────────────────────────────────

export interface LineItem {
  name: string;
  amount: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface ParsedReceipt {
  merchant: string;
  date: string;
  currency: string;
  line_items: LineItem[];
  subtotal: number | null;
  tax: number | null;
  tip: number | null;
  discount: number | null;
  total: number;
  overall_confidence: 'high' | 'medium' | 'low';
}

export type ParseResult =
  | { parseFailed: false; data: ParsedReceipt }
  | { parseFailed: true; rawText: string };

// ── Schema (used for Gemini structured output) ──────────────────────────────

const receiptSchema = {
  type: Type.OBJECT,
  properties: {
    merchant: { type: Type.STRING },
    date: { type: Type.STRING },
    currency: { type: Type.STRING },
    line_items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          amount: { type: Type.NUMBER },
          confidence: {
            type: Type.STRING,
            enum: ['high', 'medium', 'low'],
          },
        },
        required: ['name', 'amount', 'confidence'],
      },
    },
    subtotal: { type: Type.NUMBER, nullable: true },
    tax: { type: Type.NUMBER, nullable: true },
    tip: { type: Type.NUMBER, nullable: true },
    discount: { type: Type.NUMBER, nullable: true },
    total: { type: Type.NUMBER },
    overall_confidence: {
      type: Type.STRING,
      enum: ['high', 'medium', 'low'],
    },
  },
  required: [
    'merchant',
    'date',
    'currency',
    'line_items',
    'total',
    'overall_confidence',
  ],
} as const;

// ── Prompt ───────────────────────────────────────────────────────────────────

const EXTRACTION_PROMPT = `You are an expert receipt parser. Analyze the receipt image and extract structured data.

CRITICAL RULES:
- "line_items" must ONLY contain actual purchased goods or services that have their own individual price on the receipt.
- NEVER put subtotal, tax, tip, discount, service charges, or any summary/aggregate line into "line_items". Those go in their dedicated top-level fields (subtotal, tax, tip, discount).
- For "date", normalize whatever format is printed on the receipt to ISO 8601 (YYYY-MM-DD).
- For "currency", provide your best guess based on the receipt (e.g. "USD", "EUR", "GBP").

CONFIDENCE GUIDELINES:
- "high": The text is clear, unambiguous, and easily readable.
- "medium": The text is legible but oddly formatted, partially obscured, or could be misread.
- "low": The text is blurry, faded, cut off, or you had to guess the value.

Apply confidence per line item. Set overall_confidence to the lowest confidence among all extracted fields.

Return ONLY valid JSON matching the required schema. Do not include any text outside the JSON.`;

// ── Parsing / validation ────────────────────────────────────────────────────

/**
 * Validates that a parsed object matches the expected ParsedReceipt shape.
 * Returns the validated receipt or throws if invalid.
 */
export function validateReceipt(obj: unknown): ParsedReceipt {
  if (typeof obj !== 'object' || obj === null) {
    throw new Error('Response is not an object');
  }

  const r = obj as Record<string, unknown>;

  if (typeof r.merchant !== 'string') throw new Error('Missing/invalid merchant');
  if (typeof r.date !== 'string') throw new Error('Missing/invalid date');
  if (typeof r.currency !== 'string') throw new Error('Missing/invalid currency');
  if (typeof r.total !== 'number') throw new Error('Missing/invalid total');
  if (!Array.isArray(r.line_items)) throw new Error('Missing/invalid line_items');
  if (!['high', 'medium', 'low'].includes(r.overall_confidence as string)) {
    throw new Error('Missing/invalid overall_confidence');
  }

  for (const item of r.line_items) {
    if (typeof item !== 'object' || item === null) throw new Error('Invalid line item');
    if (typeof item.name !== 'string') throw new Error('Line item missing name');
    if (typeof item.amount !== 'number') throw new Error('Line item missing amount');
    if (!['high', 'medium', 'low'].includes(item.confidence)) {
      throw new Error('Line item missing/invalid confidence');
    }
  }

  return {
    merchant: r.merchant as string,
    date: r.date as string,
    currency: r.currency as string,
    line_items: r.line_items as LineItem[],
    subtotal: typeof r.subtotal === 'number' ? r.subtotal : null,
    tax: typeof r.tax === 'number' ? r.tax : null,
    tip: typeof r.tip === 'number' ? r.tip : null,
    discount: typeof r.discount === 'number' ? r.discount : null,
    total: r.total as number,
    overall_confidence: r.overall_confidence as 'high' | 'medium' | 'low',
  };
}

/**
 * Attempts to parse & validate raw model text into a ParsedReceipt.
 */
export function parseReceiptJSON(text: string): ParsedReceipt {
  const parsed = JSON.parse(text);
  return validateReceipt(parsed);
}

// ── Gemini client ───────────────────────────────────────────────────────────

/**
 * Extracts receipt data from an image using the Gemini API.
 *
 * Separated from the Express route so it can be unit-tested independently.
 *
 * @param imageBase64 - Base64-encoded image data (no data: prefix)
 * @param mimeType    - MIME type of the image (image/jpeg or image/png)
 */
export async function extractReceipt(
  imageBase64: string,
  mimeType: string,
): Promise<ParseResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not set. Copy server/.env.example to server/.env and add your key.',
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  // ── First attempt ─────────────────────────────────────────────────────
  let firstResponse: GenerateContentResponse;
  try {
    firstResponse = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: [
        {
          role: 'user',
          parts: [
            { text: EXTRACTION_PROMPT },
            {
              inlineData: {
                mimeType,
                data: imageBase64,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: receiptSchema,
      },
    });
  } catch (err) {
    // Network / auth errors bubble up to the route handler's try/catch
    throw err;
  }

  const firstText = firstResponse.text ?? '';

  try {
    const receipt = parseReceiptJSON(firstText);
    return { parseFailed: false, data: receipt };
  } catch {
    // First parse failed — try once more with a follow-up message
  }

  // ── Retry ─────────────────────────────────────────────────────────────
  let retryResponse: GenerateContentResponse;
  try {
    retryResponse = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: [
        {
          role: 'user',
          parts: [
            { text: EXTRACTION_PROMPT },
            {
              inlineData: {
                mimeType,
                data: imageBase64,
              },
            },
          ],
        },
        {
          role: 'model',
          parts: [{ text: firstText }],
        },
        {
          role: 'user',
          parts: [
            {
              text: 'Your previous output was invalid or did not match the required JSON schema. Please try again and return ONLY valid JSON matching the exact schema, with no extra text.',
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: receiptSchema,
      },
    });
  } catch (err) {
    throw err;
  }

  const retryText = retryResponse.text ?? '';

  try {
    const receipt = parseReceiptJSON(retryText);
    return { parseFailed: false, data: receipt };
  } catch {
    // Both attempts failed — return graceful failure so the frontend can
    // render a blank editable form instead of an error screen.
    return { parseFailed: true, rawText: retryText };
  }
}
