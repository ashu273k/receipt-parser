# Receipt Parser

A web app that extracts structured data from receipt images using Google's Gemini API, then lets you review, correct, and save the results.

Built with React + TypeScript (Vite) on the frontend and Node.js + Express + TypeScript on the backend, with better-sqlite3 for persistence.

## Demo Video

Watch the walkthrough here: https://youtu.be/MkFjUd-SfMw

## Questions

### 1. What did you build?
- I had created a receipt parser web app that takes the recipts images and it extractes the data in the structured ways
- Basically I am saying that we are taking the unstructered data we are making it in the structured format.

### 2. What are the biggest tradeoffs you made, and why?
1. I had used the sqllite database why if you say? Because I wanted simplicity and power like SQL   :) 
2.  I had used gemini model as the LLM parser that will understand the image why?? I don't have the poweerful models and I don't have the budget. So I preferred it. Also it does most the work effieciently.
3. The most important decision that I have to take was what will my application will do during fallback or when it gives me wrong output. I had tried to refine the prompt to give it the correct option and also added the option to human can edit it after parsing. Also first our application will try 2 times till it get output otherwise human will have to add it manually.



### 3. Where did you use an LLM, and for what? 
- For the architecture or high-level design I had used sonnet extra effort mode. To first plan and get the detailed prompt.
- Then I had handoffs the project scalfolding the project to the gemini 3.1 pro
- Then for the generation of the api endpoints I handoffs to the claude opus 4.6
- Then I ran multiple subagent for the frontend, testing, docs writing all of these.
- I ran the project and fix the problem when running in the first iteration.
- So I fix the problems like the api endpoint is not properly connected with

### 4. What would you do with another week? 
- I would first made the frontend beautiful and UI/UX
- I would be taking the feedback from the user what they want.
- Also I had left the part for the future if we got wrong/unclear output then we would like to give notification to the user.

### 5. How do you handle low-confidence extractions?
- I will put HF + I will do the image modification for the low quality /blurry images so that we can properly.

### 6. How does the user know what to correct?
- User will have to check with the original image

### 7. What's one thing in this spec you'd push back on if I were your PM?
- I would push back on the accuracy part and fully autonomous. Basically low-confidence extraction things.

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