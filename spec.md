## Step 1 - Scaffold

I'm building a receipt-parser web app for a take-home assignment (3-4 hour budget). Scaffold a monorepo with this exact structure:

- /server — Node.js + TypeScript + Express backend
  - uses better-sqlite3 for persistence (single file db.sqlite, auto-created on first run)
  - uses @google/genai as a dependency (I'll write the actual Gemini call logic next, just set it up)
  - tsx for dev with hot reload
  - multer for handling multipart image uploads, limit 8MB, accept jpg/png only
- /client — React + TypeScript + Vite frontend, minimal CSS (no component library), with a proxy in vite.config.ts so it can call /api/* on the server without CORS issues
- root package.json with a single `npm run dev` script using `concurrently` to start both server and client together
- .env.example in /server with GEMINI_API_KEY=
- .gitignore covering node_modules, .env, dist, db.sqlite

Don't implement business logic yet — just get both halves running, with a health-check GET /api/health on the server and a placeholder page on the client that fetches it and displays "API OK". Ask me before installing anything not on this list.

## Step 2 - Backend: Gemini extraction endpoint

Build the core extraction endpoint: POST /api/receipts/parse, accepting a single image file (multipart field name "receipt").

Use the @google/genai SDK (GoogleGenAI class). Model: "gemini-flash-latest". Read GEMINI_API_KEY from process.env.

Requirements:
1. Convert the uploaded image to base64 and send it as inline image data alongside a text prompt via generateContent.
2. Force structured output (responseMimeType: "application/json" + a responseSchema) with this shape:
   - merchant: string
   - date: string (ISO 8601 — normalize whatever format is printed on the receipt)
   - currency: string (best guess, e.g. "USD")
   - line_items: array of { name: string, amount: number, confidence: "high" | "medium" | "low" }
   - subtotal: number | null
   - tax: number | null
   - tip: number | null
   - discount: number | null
   - total: number
   - overall_confidence: "high" | "medium" | "low"
3. In the prompt text, explicitly instruct the model: line_items are ONLY actual purchased goods/services with their own price — subtotal/tax/tip/discount never go in that array, they go in their dedicated fields. Also instruct it to mark confidence "low" on anything blurry, faded, or guessed, "medium" if legible but oddly formatted, "high" if clear and unambiguous.
4. If the response fails to parse as valid JSON matching the schema, retry ONCE with a follow-up message saying the last output was invalid and to return ONLY valid JSON matching the schema. If it fails a second time, don't throw — return HTTP 200 with { parseFailed: true, rawText: <model's last output> } so the frontend can fall back to a blank editable form.
5. Wrap the whole thing in try/catch — network errors or a missing API key should return a clear 500 with a message, never an unhandled crash.

Structure this as a separate module for the Gemini client vs. the Express route handler, so I can unit test the parsing/retry logic later without spinning up a server.

## Step 3 - Persistence

Add persistence with better-sqlite3. Create a `receipts` table: id (uuid, pk), merchant, date, currency, subtotal, tax, tip, discount, total, line_items (stored as JSON text), overall_confidence, reviewed (boolean, default false), created_at.

Add two endpoints:
- POST /api/receipts — saves a receipt (the corrected data the frontend sends after the user reviews/edits it). Set reviewed = true.
- GET /api/receipts — lists saved receipts, newest first.

Keep the db module separate from the routes, with an init function that creates the table if missing. No migrations framework — this is a take-home.

## Step 4 — Frontend: upload + results view

Build the main React flow:
1. Upload screen: file input (accept image/jpeg,image/png) + drag-and-drop area, a preview thumbnail once a file is picked, and an "Extract" button that POSTs to /api/receipts/parse with a loading spinner while it waits.
2. Results/review screen rendered once extraction returns: merchant, date, currency, total as editable text inputs; line items as an editable table (name + amount columns) with add-row and delete-row; subtotal/tax/tip/discount as editable number inputs that allow blank/null.
3. If parseFailed came back true, show a banner: "We couldn't read this receipt automatically — please fill in the fields below" and render the same form fully blank instead of erroring out.

Split into a few well-named components (UploadScreen, ReceiptReviewForm, LineItemsTable) with state lifted to a parent. Plain CSS, no UI kit. Don't wire up Save yet — that's next.

##  Step 5 — Correction UX (this is the part the spec says matters most)

This is the most important part of the app — make the review/correction screen genuinely good, not a plain form. Add:

1. Confidence highlighting: fields with confidence "low" get a subtle amber left-border/background tint, "medium" a lighter tint, "high" no styling. Apply to merchant/date/total (fall back to overall_confidence if a field lacks its own) and per-row in the line items table.
2. A live math-check banner: continuously recompute sum(line_items.amount) + tax + tip - discount and compare to total. If they don't match within 1 cent, show a non-blocking warning like "Items + tax − discount = $X, but total says $Y — check for a missing line item or typo," updating live as the user edits.
3. Sensible keyboard flow: Tab moves logically through fields and table rows; Enter on the last line-item row adds a new blank row.
4. A Save button, disabled until merchant/date/total are non-empty, that POSTs the corrected object to POST /api/receipts on click, shows a success state, and returns to the upload screen.

Keep it simple — no drag-to-reorder, no rich text. Fast, obvious, keyboard-friendly correction is the whole point.

## Step 6 — History view (first thing to cut if you're behind schedule)

Add a simple "Past receipts" tab: fetch GET /api/receipts and list them (merchant, date, total, reviewed badge) newest first. Clicking a row shows a read-only expanded view of its line items — it doesn't need to be editable again.

## Step 7 — Tests (targeted, not exhaustive)

Add focused tests, not full coverage. Specifically:
1. Unit tests (vitest or jest — pick whichever is faster given what's already installed) for the Gemini response parsing/retry logic on the server, with the Gemini client mocked: (a) valid schema-matching JSON passes through unchanged, (b) invalid JSON on first try but valid on retry returns the retried result, (c) invalid JSON twice returns { parseFailed: true }.
2. One test for the live math-check calculation on the frontend — extract it as a pure function if it isn't already, and test it directly.
3. Do NOT write tests for basic CRUD wiring, React render snapshots, or Express route plumbing — they wouldn't catch anything I actually care about breaking.

## Step 8 — Env, scripts, final pass

Final pass:
1. Confirm `npm run dev` from the repo root starts both server and client with one command, and that a fresh clone + `npm install` + copying .env.example to .env + adding a real GEMINI_API_KEY + `npm run dev` is enough to run everything. Walk me through the exact steps you'd tell a reviewer, so I can sanity-check it.
2. Confirm .env is gitignored and .env.example only has GEMINI_API_KEY= with no real value.
3. Add a root README.md with just a "Quickstart" section (env vars, how to run) — I'll write the five reflection questions myself.
4. List anything you cut or left unfinished due to time so I can decide what to mention in the README.