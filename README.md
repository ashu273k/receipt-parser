# Receipt Parser

A web app that extracts structured data from receipt images using Google's Gemini API, then lets you review, correct, and save the results.

Built with React + TypeScript (Vite) on the frontend and Node.js + Express + TypeScript on the backend, with better-sqlite3 for persistence.

## Quickstart

```bash
# 1. Clone and install
git clone <repo-url>
cd receipt-parser
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

# 2. Configure API key
cp server/.env.example server/.env
# Edit server/.env and add your Gemini API key:
#   GEMINI_API_KEY=your_key_here

# 3. Run
npm run dev
```

This starts both the server (port 3001) and the client (port 5173) with a single command. The client proxies `/api/*` requests to the server automatically.

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Environment Variables

| Variable | Location | Description |
|---|---|---|
| `GEMINI_API_KEY` | `server/.env` | Your Google Gemini API key (required) |

## Running Tests

```bash
# Server tests (Gemini parsing/retry logic)
cd server && npx vitest run

# Client tests (math-check calculation)
cd client && npx vitest run
```

## Project Structure

```
receipt-parser/
├── client/               # React + Vite frontend
│   └── src/
│       ├── components/   # UploadScreen, ReceiptReviewForm, LineItemsTable, HistoryView
│       ├── mathCheck.ts  # Pure function for live math-check (tested)
│       ├── types.ts      # Shared TypeScript types
│       └── App.tsx       # Main app with state management
├── server/               # Node.js + Express backend
│   ├── gemini-client.ts  # Gemini API client with retry logic (tested)
│   ├── db.ts             # better-sqlite3 persistence layer
│   ├── routes/
│   │   ├── parse.ts      # POST /api/receipts/parse (image extraction)
│   │   └── receipts.ts   # GET & POST /api/receipts (CRUD)
│   └── index.ts          # Express app entry point
├── package.json          # Root scripts (npm run dev)
└── README.md
```
