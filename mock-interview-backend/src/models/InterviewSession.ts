import { Schema, model, type InferSchemaType } from 'mongoose';

const evaluationSchema = new Schema(
  {
    score: { type: Number, default: 0 },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    suggestions: [{ type: String }],
  },
  { _id: false },
);

const questionSchema = new Schema({
  order: { type: Number, required: true },
  text: { type: String, required: true },
  transcript: { type: String, default: '' },
  evaluation: { type: evaluationSchema },
});

const interviewSessionSchema = new Schema(
  {
    jobRole: { type: String, required: true },
    experienceLevel: { type: String, required: true },
    interviewType: { type: String, enum: ['Technical', 'HR', 'Mixed'], required: true },
    status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' },
    questions: [questionSchema],
    finalScore: { type: Number, default: 0 },
    finalFeedback: { type: String, default: '' },
  },
  { timestamps: true },
);

export type InterviewSessionDocument = InferSchemaType<typeof interviewSessionSchema>;
export const InterviewSession = model('InterviewSession', interviewSessionSchema);
