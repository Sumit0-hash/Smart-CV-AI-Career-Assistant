import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeneratedQuestion {
  question: string;
}

export interface EvaluationResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  feedback: string;
}

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is missing.');

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json' },
  });
}

// Prompt template for interview question generation.
export async function generateInterviewQuestions(input: {
  jobRole: string;
  experienceLevel: string;
  interviewType: 'Technical' | 'HR' | 'Mixed';
}) {
  const model = getModel();

  const prompt = `
You are an expert interviewer.
Generate exactly 7 concise interview questions for the following setup:
- Job Role: ${input.jobRole}
- Experience Level: ${input.experienceLevel}
- Interview Type: ${input.interviewType}

Rules:
1) Technical: focus on coding/system/design concepts.
2) HR: focus on communication, collaboration, conflict, ownership.
3) Mixed: blend technical and HR naturally.
4) Keep each question under 35 words.

Return strict JSON only:
{
  "questions": [
    { "question": "..." }
  ]
}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const parsed = JSON.parse(text) as { questions: GeneratedQuestion[] };

  if (!Array.isArray(parsed.questions) || parsed.questions.length !== 7) {
    throw new Error('Gemini did not return 7 questions.');
  }

  return parsed.questions;
}

// Prompt template for per-question answer evaluation.
export async function evaluateInterviewAnswer(input: {
  question: string;
  transcript: string;
  jobRole: string;
  experienceLevel: string;
}) {
  const model = getModel();

  const prompt = `
You are an interview evaluator for ${input.jobRole} (${input.experienceLevel}).
Evaluate the candidate answer.

Question:
${input.question}

Candidate transcript:
${input.transcript}

Return strict JSON only:
{
  "score": 0-10 integer,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "improvements": ["..."],
  "feedback": "2-3 sentence summary"
}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  return JSON.parse(text) as EvaluationResult;
}

// Prompt template for final overall scoring + feedback.
export async function buildFinalInterviewFeedback(input: {
  jobRole: string;
  experienceLevel: string;
  evaluations: Array<{ score: number; feedback: string }>;
}) {
  const model = getModel();

  const prompt = `
You are a final interview reviewer.
Role: ${input.jobRole}
Experience: ${input.experienceLevel}
Per-question evaluations: ${JSON.stringify(input.evaluations)}

Return strict JSON only:
{
  "overallScore": 0-10 number,
  "overallFeedback": "one detailed paragraph"
}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  return JSON.parse(text) as { overallScore: number; overallFeedback: string };
}
