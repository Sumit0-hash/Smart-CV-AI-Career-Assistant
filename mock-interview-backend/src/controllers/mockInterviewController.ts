import type { Request, Response } from 'express';
import { InterviewSession } from '../models/InterviewSession.js';
import {
  evaluateAnswer,
  generateFinalReport,
  generateInterviewQuestions,
} from '../services/geminiService.js';
import { transcribeAudio } from '../services/assemblyAiService.js';

export async function createSession(req: Request, res: Response) {
  try {
    const { jobRole, experienceLevel, interviewType } = req.body as {
      jobRole: string;
      experienceLevel: string;
      interviewType: string;
    };

    if (!jobRole || !experienceLevel || !interviewType) {
      res.status(400).json({ message: 'jobRole, experienceLevel, and interviewType are required.' });
      return;
    }

    const generatedQuestions = await generateInterviewQuestions({
      jobRole,
      experienceLevel,
      interviewType,
    });

    const session = await InterviewSession.create({
      jobRole,
      experienceLevel,
      interviewType,
      questions: generatedQuestions.map((text, index) => ({
        order: index + 1,
        text,
      })),
    });

    res.status(201).json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create interview session.' });
  }
}

export async function answerQuestion(req: Request, res: Response) {
  try {
    const { sessionId, questionId } = req.params;
    const audioFile = req.file;

    if (!audioFile) {
      res.status(400).json({ message: 'Audio file is required.' });
      return;
    }

    const session = await InterviewSession.findById(sessionId);
    if (!session) {
      res.status(404).json({ message: 'Interview session not found.' });
      return;
    }

    const question = session.questions.id(questionId);
    if (!question) {
      res.status(404).json({ message: 'Question not found.' });
      return;
    }

    let transcript = '';
    try {
      transcript = await transcribeAudio(audioFile.buffer);
    } catch (err) {
      console.error("Transcription Error:", err);
      transcript = 'Transcription service unavailable. Please retry this question later.';
    }

    let evaluation = {
      score: 0,
      strengths: ['Response was captured.'],
      weaknesses: ['Automated evaluator is temporarily unavailable.'],
      suggestions: ['Retry evaluation after a short while.'],
    };

    try {
      evaluation = await evaluateAnswer({ question: question.text, transcript });
    } catch {
      // Graceful fallback when Gemini fails.
    }

    question.transcript = transcript;
    question.evaluation = evaluation;

    await session.save();
    res.json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to process answer.' });
  }
}

export async function finalizeSession(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const session = await InterviewSession.findById(sessionId);

    if (!session) {
      res.status(404).json({ message: 'Interview session not found.' });
      return;
    }

    const payload = {
      jobRole: session.jobRole,
      experienceLevel: session.experienceLevel,
      interviewType: session.interviewType,
      questions: session.questions.map((item) => ({
        question: item.text,
        transcript: item.transcript ?? '',
        score: item.evaluation?.score ?? 0,
      })),
    };

    try {
      const result = await generateFinalReport(payload);
      session.finalScore = result.finalScore;
      session.finalFeedback = result.overallFeedback;
    } catch {
      const scores = session.questions.map((q) => q.evaluation?.score ?? 0);
      const average = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
      session.finalScore = Math.round(average * 10) / 10;
      session.finalFeedback =
        'Final feedback service is unavailable, but your session was saved. Please review individual question feedback and retry final report later.';
    }

    session.status = 'completed';
    await session.save();
    res.json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to finalize interview.' });
  }
}

export async function getSession(req: Request, res: Response) {
  const session = await InterviewSession.findById(req.params.sessionId);
  if (!session) {
    res.status(404).json({ message: 'Interview session not found.' });
    return;
  }

  res.json(session);
}

export async function listSessions(_req: Request, res: Response) {
  const sessions = await InterviewSession.find().sort({ createdAt: -1 }).limit(30);
  res.json(sessions);
}
