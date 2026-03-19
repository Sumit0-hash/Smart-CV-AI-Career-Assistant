import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';
import {
  buildEvaluationPrompt,
  buildFinalReportPrompt,
  buildQuestionGenerationPrompt,
} from '../prompts/geminiPrompts.js';

const model = new GoogleGenerativeAI(env.geminiApiKey).getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
  },
});

function parseJson<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Gemini returned invalid JSON');
    return JSON.parse(match[0]) as T;
  }
}

export async function generateInterviewQuestions(input: {
  jobRole: string;
  experienceLevel: string;
  interviewType: string;
}) {
  const response = await model.generateContent(
    buildQuestionGenerationPrompt(input.jobRole, input.experienceLevel, input.interviewType),
  );

  const data = parseJson<{ questions: string[] }>(response.response.text());
  const questions = Array.isArray(data.questions) ? data.questions.slice(0, 7) : [];

  if (questions.length !== 7) {
    throw new Error('Gemini did not return exactly 7 questions.');
  }

  return questions;
}

export async function evaluateAnswer(input: { question: string; transcript: string }) {
  const response = await model.generateContent(
    buildEvaluationPrompt(input.question, input.transcript),
  );

  const data = parseJson<{
    score: number;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  }>(response.response.text());

  return {
    score: Math.max(0, Math.min(10, Math.round(Number(data.score ?? 0)))),
    strengths: Array.isArray(data.strengths) ? data.strengths : [],
    weaknesses: Array.isArray(data.weaknesses) ? data.weaknesses : [],
    suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
  };
}

export async function generateFinalReport(input: {
  jobRole: string;
  experienceLevel: string;
  interviewType: string;
  questions: Array<{ question: string; transcript: string; score: number }>;
}) {
  const response = await model.generateContent(buildFinalReportPrompt(input));

  const data = parseJson<{ finalScore: number; overallFeedback: string }>(response.response.text());

  return {
    finalScore: Math.max(0, Math.min(10, Math.round(Number(data.finalScore ?? 0)))),
    overallFeedback: data.overallFeedback || 'Interview completed. Keep practicing to improve clarity and confidence.',
  };
}
