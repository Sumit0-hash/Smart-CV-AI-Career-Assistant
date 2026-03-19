import dotenv from 'dotenv';

dotenv.config();

const required = ['MONGODB_URI', 'GEMINI_API_KEY', 'ASSEMBLYAI_API_KEY'] as const;

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  port: Number(process.env.PORT ?? 5001),
  mongoUri: process.env.MONGODB_URI!,
  geminiApiKey: process.env.GEMINI_API_KEY!,
  assemblyAiApiKey: process.env.ASSEMBLYAI_API_KEY!,
  allowedOrigin: process.env.ALLOWED_ORIGIN ?? 'http://localhost:5173',
};
