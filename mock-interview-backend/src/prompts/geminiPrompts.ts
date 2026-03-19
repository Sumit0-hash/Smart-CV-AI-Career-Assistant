export function buildQuestionGenerationPrompt(jobRole: string, experienceLevel: string, interviewType: string) {
  return `You are an expert interviewer.
Generate exactly 7 concise interview questions in JSON format only.

Context:
- Job Role: ${jobRole}
- Experience Level: ${experienceLevel}
- Interview Type: ${interviewType}

Return strict JSON:
{
  "questions": ["question 1", "question 2", "..."]
}

Rules:
- Keep each question under 35 words.
- If interview type is Mixed, include technical and behavioral questions.
- Do not include markdown.`;
}

export function buildEvaluationPrompt(question: string, transcript: string) {
  return `You are an interview evaluator.
Evaluate the candidate answer for the question below.

Question: ${question}
Candidate Answer Transcript: ${transcript}

Return strict JSON:
{
  "score": 0,
  "strengths": [""],
  "weaknesses": [""],
  "suggestions": [""]
}

Rules:
- score must be an integer from 0 to 10.
- strengths/weaknesses/suggestions should have 2-4 concise bullet-style strings.
- Do not include markdown.`;
}

export function buildFinalReportPrompt(payload: {
  jobRole: string;
  experienceLevel: string;
  interviewType: string;
  questions: Array<{ question: string; transcript: string; score: number }>;
}) {
  return `You are a senior interview coach.
Create a final interview report based on all responses.

Session:
${JSON.stringify(payload, null, 2)}

Return strict JSON only:
{
  "finalScore": 0,
  "overallFeedback": ""
}

Rules:
- finalScore should be an integer from 0 to 10.
- overallFeedback must be 4-6 sentences and actionable.
- Do not include markdown.`;
}
