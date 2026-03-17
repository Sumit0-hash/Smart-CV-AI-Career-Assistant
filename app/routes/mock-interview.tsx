import type { Route } from './+types/mock-interview';
import { useEffect, useMemo, useRef, useState } from 'react';
import Navbar from '~/components/Navbar';
import { requireUser } from '~/services/auth.server';

interface InterviewQuestion {
  _id: string;
  question: string;
  transcript?: string;
  evaluation?: {
    score: number;
    strengths: string[];
    weaknesses: string[];
    improvements: string[];
    feedback: string;
  };
}

interface InterviewSessionSummary {
  _id: string;
  jobRole: string;
  experienceLevel: string;
  interviewType: string;
  status: string;
  overallScore: number;
  createdAt: string;
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);
  return null;
}

export default function MockInterviewPage() {
  const [jobRole, setJobRole] = useState('Frontend Developer');
  const [experienceLevel, setExperienceLevel] = useState('Junior');
  const [interviewType, setInterviewType] = useState<'Technical' | 'HR' | 'Mixed'>('Mixed');

  const [sessionId, setSessionId] = useState<string>('');
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [overallFeedback, setOverallFeedback] = useState('');
  const [sessions, setSessions] = useState<InterviewSessionSummary[]>([]);

  const [isSetupLoading, setIsSetupLoading] = useState(false);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState('');

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    void loadSessions();
  }, []);

  const currentQuestion = useMemo(() => questions[questionIndex], [questions, questionIndex]);

  async function loadSessions() {
    try {
      const response = await fetch('/api/mock-interview/sessions');
      const data = await response.json();
      setSessions(data.sessions ?? []);
    } catch (loadError) {
      console.error(loadError);
    }
  }

  async function setupInterview() {
    setError('');
    setIsSetupLoading(true);

    try {
      const response = await fetch('/api/mock-interview/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobRole, experienceLevel, interviewType }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Setup failed');

      setSessionId(data.sessionId);
      setQuestions(data.questions);
      setQuestionIndex(0);
      setOverallScore(null);
      setOverallFeedback('');
    } catch (setupError) {
      setError('Failed to generate interview questions. Please try again.');
      console.error(setupError);
    } finally {
      setIsSetupLoading(false);
    }
  }

  // Audio handling: request Azure TTS for current question and play it in browser.
  async function playQuestionAudio() {
    if (!currentQuestion) return;

    try {
      const response = await fetch('/api/mock-interview/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: currentQuestion.question }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'TTS failed');

      const audio = new Audio(`data:${data.mimeType};base64,${data.base64Audio}`);
      await audio.play();
    } catch (ttsError) {
      console.error(ttsError);
      setError('Could not play question audio. You can still continue by reading the question text.');
    }
  }

  // MediaRecorder implementation: captures microphone input to send as multipart/form-data.
  async function startRecording() {
    setError('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        await submitAnswer(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (recordError) {
      console.error(recordError);
      setError('Microphone access failed. Check browser permission and retry.');
    }
  }

  function stopRecording() {
    if (!recorderRef.current) return;
    recorderRef.current.stop();
    setIsRecording(false);
  }

  async function submitAnswer(audioBlob: Blob) {
    if (!sessionId || !currentQuestion) return;

    setIsSubmittingAnswer(true);

    try {
      const formData = new FormData();
      formData.append('sessionId', sessionId);
      formData.append('questionId', currentQuestion._id);
      formData.append('audio', audioBlob, 'answer.webm');

      const response = await fetch('/api/mock-interview/answer', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Submit failed');

      setQuestions((previous) =>
        previous.map((item, index) =>
          index === questionIndex ? { ...item, transcript: data.transcript, evaluation: data.evaluation } : item
        )
      );

      if (data.status === 'completed') {
        setOverallScore(data.overallScore);
        setOverallFeedback(data.overallFeedback);
        await loadSessions();
      } else {
        setQuestionIndex((value) => value + 1);
      }
    } catch (submitError) {
      console.error(submitError);
      setError('Answer submission failed. Please retry this question.');
    } finally {
      setIsSubmittingAnswer(false);
    }
  }

  return (
    <main className="bg-slate-50 min-h-screen">
      <Navbar />
      <section className="main-section py-10 space-y-8">
        <div className="page-heading">
          <h1>AI Mock Interview (Voice Enabled)</h1>
          <h2>Generate interview questions, answer by voice, and receive AI scoring with actionable feedback.</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
            <h3 className="text-xl font-semibold text-slate-900">Interview Setup</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input value={jobRole} onChange={(event) => setJobRole(event.target.value)} className="p-3 border rounded-xl" />
              <select value={experienceLevel} onChange={(event) => setExperienceLevel(event.target.value)} className="p-3 border rounded-xl">
                <option>Intern</option>
                <option>Junior</option>
                <option>Mid-Level</option>
                <option>Senior</option>
                <option>Lead</option>
              </select>
              <select value={interviewType} onChange={(event) => setInterviewType(event.target.value as 'Technical' | 'HR' | 'Mixed')} className="p-3 border rounded-xl">
                <option value="Technical">Technical</option>
                <option value="HR">HR</option>
                <option value="Mixed">Mixed</option>
              </select>
            </div>
            <button onClick={setupInterview} disabled={isSetupLoading} className="primary-button">
              {isSetupLoading ? 'Generating...' : 'Start Mock Interview'}
            </button>

            {currentQuestion && (
              <div className="mt-6 p-4 bg-slate-100 rounded-xl space-y-4">
                <p className="font-semibold text-slate-700">
                  Question {questionIndex + 1} / {questions.length}
                </p>
                <p className="text-slate-900 text-lg">{currentQuestion.question}</p>

                <div className="flex flex-wrap gap-3">
                  <button onClick={playQuestionAudio} className="px-4 py-2 rounded-lg bg-indigo-600 text-white">
                    Play Question Voice
                  </button>
                  {!isRecording ? (
                    <button onClick={startRecording} className="px-4 py-2 rounded-lg bg-emerald-600 text-white">
                      Start Recording
                    </button>
                  ) : (
                    <button onClick={stopRecording} className="px-4 py-2 rounded-lg bg-rose-600 text-white">
                      Stop & Submit
                    </button>
                  )}
                </div>

                {isSubmittingAnswer && <p className="text-sm text-slate-600">Transcribing and evaluating your answer...</p>}

                {currentQuestion.transcript && (
                  <div className="space-y-2 text-sm">
                    <p><strong>Transcript:</strong> {currentQuestion.transcript}</p>
                    <p><strong>Score:</strong> {currentQuestion.evaluation?.score ?? 0} / 10</p>
                    <p><strong>Feedback:</strong> {currentQuestion.evaluation?.feedback ?? '-'}</p>
                  </div>
                )}
              </div>
            )}

            {overallScore !== null && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300">
                <p className="text-lg font-semibold">Final Score: {overallScore} / 10</p>
                <p className="text-sm text-slate-700 mt-1">{overallFeedback}</p>
              </div>
            )}

            {error && <p className="text-red-600 text-sm">{error}</p>}
          </div>

          <aside className="bg-white rounded-2xl p-6 border border-slate-200">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Past Interviews</h3>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {sessions.map((session) => (
                <a key={session._id} href={`/mock-interview/report/${session._id}`} className="block p-3 rounded-lg border border-slate-200 hover:bg-slate-50">
                  <p className="font-semibold text-slate-800">{session.jobRole}</p>
                  <p className="text-sm text-slate-600">{session.experienceLevel} • {session.interviewType}</p>
                  <p className="text-sm text-slate-600">Status: {session.status}</p>
                  <p className="text-sm text-slate-600">Score: {session.overallScore ?? 0}</p>
                </a>
              ))}
              {sessions.length === 0 && <p className="text-sm text-slate-500">No interview history yet.</p>}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
