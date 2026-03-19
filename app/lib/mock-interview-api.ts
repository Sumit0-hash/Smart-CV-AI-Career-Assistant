import axios from 'axios';
import type { InterviewSession, InterviewSetupPayload } from '~/types/mock-interview';

const API_BASE = import.meta.env.VITE_MOCK_INTERVIEW_API_URL ?? 'http://localhost:5001/api/mock-interviews';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 90_000,
});

export async function createInterviewSession(payload: InterviewSetupPayload) {
  const { data } = await client.post<InterviewSession>('/sessions', payload);
  return data;
}

export async function transcribeAndEvaluateAnswer(sessionId: string, questionId: string, audioBlob: Blob) {
  const formData = new FormData();
  formData.append('audio', audioBlob, `answer-${questionId}.webm`);

  const { data } = await client.post<InterviewSession>(
    `/sessions/${sessionId}/questions/${questionId}/answer`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return data;
}

export async function finalizeInterview(sessionId: string) {
  const { data } = await client.post<InterviewSession>(`/sessions/${sessionId}/finalize`);
  return data;
}

export async function getInterviewSession(sessionId: string) {
  const { data } = await client.get<InterviewSession>(`/sessions/${sessionId}`);
  return data;
}

export async function getInterviewHistory() {
  const { data } = await client.get<InterviewSession[]>('/sessions');
  return data;
}
