# Quick Start Guide

## 1) Install dependencies
```bash
npm install
```

## 2) Configure environment variables
```bash
cp .env.example .env
```

Set these required values in `.env`:
- `GEMINI_API_KEY`
- `AZURE_SPEECH_KEY`
- `AZURE_SPEECH_REGION`
- `MONGODB_URI`
- `MONGODB_DB_NAME` (optional, default: `smartcv`)
- `VITE_JSEARCH_API_KEY`

## 3) Start MongoDB
If local:
```bash
mongod --dbpath /path/to/your/db
```
Or use MongoDB Atlas and point `MONGODB_URI` to your cluster URL.

## 4) Run the app
```bash
npm run dev
```

Open: `http://localhost:5173`

## 5) Use AI Mock Interview with Voice
1. Navigate to **MERN AI Mock Interview (Voice)**.
2. Choose **Job Role**, **Experience Level**, and **Interview Type**.
3. Click **Start Mock Interview** (Gemini generates 7 questions and stores the session in MongoDB).
4. Click **Play Question Voice** (Azure TTS).
5. Record answer with **Start Recording** / **Stop & Submit** (MediaRecorder).
6. Backend transcribes audio via **Azure STT**, evaluates each answer via **Gemini**, and stores report in MongoDB.
7. Review final score and open past session reports.

## Error handling notes
- If Azure STT fails, the app saves a fallback transcript message so the interview can continue.
- If Gemini evaluation fails, the app stores fallback scoring details and continues.
- If final Gemini summary fails, the app computes an average score from per-question results.
