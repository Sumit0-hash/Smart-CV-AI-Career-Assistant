import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('/auth', 'routes/auth.tsx'),
  route('/logout', 'routes/logout.tsx'),
  route('/resume-intelligence-suite', 'routes/upload.tsx'),
  route('/interview-qa-generator', 'routes/interview.tsx'),
  route('/mock-interview', 'routes/mock-interview.tsx'),
  route('/mock-interview/report/:sessionId', 'routes/mock-interview.report.$sessionId.tsx'),
  route('/jobs', 'routes/jobs.tsx'),
  route('/upload', 'routes/legacy-upload.tsx'),
  route('/interview', 'routes/legacy-interview.tsx'),
  route('/resume/:id', 'routes/resume.tsx'),
  route('/wipe', 'routes/wipe.tsx'),
  route('/api/generate-questions', 'routes/api.generate-questions.ts'),
  route('/api/career-roadmap', 'routes/api.career-roadmap.ts'),
  route('/api/resume-analysis', 'routes/api.resume-analysis.ts'),
  route('/api/mock-interview/setup', 'routes/api.mock-interview.setup.ts'),
  route('/api/mock-interview/answer', 'routes/api.mock-interview.answer.ts'),
  route('/api/mock-interview/tts', 'routes/api.mock-interview.tts.ts'),
  route('/api/mock-interview/report/:sessionId', 'routes/api.mock-interview.report.$sessionId.ts'),
  route('/api/mock-interview/sessions', 'routes/api.mock-interview.sessions.ts'),
] satisfies RouteConfig;
