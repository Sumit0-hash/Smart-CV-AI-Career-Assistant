export type InterviewType = 'Technical' | 'HR' | 'Mixed';
export type ExperienceLevel = 'Fresher' | 'Junior' | 'Mid-Level' | 'Senior';

export interface InterviewSetupPayload {
  jobRole: string;
  experienceLevel: ExperienceLevel;
  interviewType: InterviewType;
}

export interface AnswerEvaluation {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export interface InterviewQuestion {
  _id: string;
  order: number;
  text: string;
  transcript?: string;
  evaluation?: AnswerEvaluation;
}

export interface InterviewSession {
  _id: string;
  jobRole: string;
  experienceLevel: ExperienceLevel;
  interviewType: InterviewType;
  status: 'in_progress' | 'completed';
  questions: InterviewQuestion[];
  finalScore?: number;
  finalFeedback?: string;
  createdAt: string;
  updatedAt: string;
}
