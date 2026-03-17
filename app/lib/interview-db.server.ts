import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

const INTERVIEW_DB_FILE = resolve(process.cwd(), '.data', 'interview-sessions.json');

export interface InterviewQuestionRecord {
  _id: string;
  question: string;
  transcript: string;
  audioMimeType: string;
  evaluation: {
    score: number;
    strengths: string[];
    weaknesses: string[];
    improvements: string[];
    feedback: string;
  };
}

export interface InterviewSessionRecord {
  _id: string;
  userId: string;
  jobRole: string;
  experienceLevel: string;
  interviewType: 'Technical' | 'HR' | 'Mixed';
  status: 'in_progress' | 'completed';
  questions: InterviewQuestionRecord[];
  overallScore: number;
  overallFeedback: string;
  createdAt: string;
  updatedAt: string;
}

async function ensureDbFile() {
  await mkdir(dirname(INTERVIEW_DB_FILE), { recursive: true });
  try {
    await readFile(INTERVIEW_DB_FILE, 'utf-8');
  } catch {
    await writeFile(INTERVIEW_DB_FILE, JSON.stringify({ sessions: [] }, null, 2), 'utf-8');
  }
}

async function readDb(): Promise<{ sessions: InterviewSessionRecord[] }> {
  await ensureDbFile();
  const raw = await readFile(INTERVIEW_DB_FILE, 'utf-8');
  return JSON.parse(raw) as { sessions: InterviewSessionRecord[] };
}

async function writeDb(data: { sessions: InterviewSessionRecord[] }) {
  await writeFile(INTERVIEW_DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export async function connectToMongo() {
  // Placeholder for MongoDB/Mongoose upgrade path.
  // In this environment we persist to local JSON to keep app runnable.
  return true;
}

export async function createInterviewSession(input: {
  userId: string;
  jobRole: string;
  experienceLevel: string;
  interviewType: 'Technical' | 'HR' | 'Mixed';
  questions: string[];
}) {
  const db = await readDb();
  const now = new Date().toISOString();

  const session: InterviewSessionRecord = {
    _id: randomUUID(),
    userId: input.userId,
    jobRole: input.jobRole,
    experienceLevel: input.experienceLevel,
    interviewType: input.interviewType,
    status: 'in_progress',
    questions: input.questions.map((question) => ({
      _id: randomUUID(),
      question,
      transcript: '',
      audioMimeType: '',
      evaluation: { score: 0, strengths: [], weaknesses: [], improvements: [], feedback: '' },
    })),
    overallScore: 0,
    overallFeedback: '',
    createdAt: now,
    updatedAt: now,
  };

  db.sessions.push(session);
  await writeDb(db);
  return session;
}

export async function getInterviewSessionById(sessionId: string, userId: string) {
  const db = await readDb();
  return db.sessions.find((item) => item._id === sessionId && item.userId === userId) ?? null;
}

export async function listInterviewSessions(userId: string) {
  const db = await readDb();
  return db.sessions
    .filter((session) => session.userId === userId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function saveInterviewSession(updatedSession: InterviewSessionRecord) {
  const db = await readDb();
  const index = db.sessions.findIndex((item) => item._id === updatedSession._id);
  if (index === -1) return null;

  updatedSession.updatedAt = new Date().toISOString();
  db.sessions[index] = updatedSession;
  await writeDb(db);
  return updatedSession;
}
