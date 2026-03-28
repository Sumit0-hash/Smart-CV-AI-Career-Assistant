import { useEffect, useMemo, useState } from 'react';
import Navbar from '~/components/Navbar';
import { useAudioRecorder } from '~/hooks/useAudioRecorder';
import { useSpeechSynthesis } from '~/hooks/useSpeechSynthesis';
import {
  createInterviewSession,
  finalizeInterview,
  getInterviewHistory,
  transcribeAndEvaluateAnswer,
} from '~/lib/mock-interview-api';
import type { ExperienceLevel, InterviewSession, InterviewType } from '~/types/mock-interview';

const interviewTypes: InterviewType[] = ['Technical', 'HR', 'Mixed'];
const experienceLevels: ExperienceLevel[] = ['Fresher', 'Junior', 'Mid-Level', 'Senior'];

export default function MockInterviewPage() {
  const [jobRole, setJobRole] = useState('Frontend Developer');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('Junior');
  const [interviewType, setInterviewType] = useState<InterviewType>('Mixed');

  const [currentSession, setCurrentSession] = useState<InterviewSession | null>(null);
  const [history, setHistory] = useState<InterviewSession[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tts = useSpeechSynthesis();
  const recorder = useAudioRecorder();

  useEffect(() => {
    void (async () => {
      try {
        const sessions = await getInterviewHistory();
        setHistory(sessions);
      } catch {
        setError('Unable to load interview history right now.');
      }
    })();
  }, []);

  const currentQuestion = useMemo(
    () => currentSession?.questions[currentQuestionIndex],
    [currentSession, currentQuestionIndex],
  );

  const createSession = async () => {
    try {
      setBusy(true);
      setError(null);

      const session = await createInterviewSession({
        jobRole: jobRole.trim(),
        experienceLevel,
        interviewType,
      });

      console.log('Interview session created:', session);

      if (!session) {
        throw new Error('No session returned from createInterviewSession');
      }

      setCurrentSession(session);
      setCurrentQuestionIndex(0);
    } catch (err: any) {
      console.error('createSession error:', err);

      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to start interview. Please try again.';

      setError(message);
    } finally {
      setBusy(false);
    }
  };
  const submitAnswer = async () => {
    if (!currentSession || !currentQuestion) return;

    try {
      setBusy(true);
      setError(null);
      const audioBlob = await recorder.stopRecording();
      const updated = await transcribeAndEvaluateAnswer(
        currentSession._id,
        currentQuestion._id,
        audioBlob,
      );
      setCurrentSession(updated);
    } catch {
      setError('Failed to process audio. Please retry recording this answer.');
    } finally {
      setBusy(false);
    }
  };

  const nextStep = async () => {
    if (!currentSession) return;
    if (currentQuestionIndex < currentSession.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      return;
    }

    try {
      setBusy(true);
      const finalized = await finalizeInterview(currentSession._id);
      setCurrentSession(finalized);
      const sessions = await getInterviewHistory();
      setHistory(sessions);
    } catch {
      setError('Failed to finalize report. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const isCompleted = currentSession?.status === 'completed';

  return (
    <main className='min-h-screen bg-linear-to-br from-slate-50 to-blue-50'>
      <Navbar />
      <section className='main-section py-10 space-y-8'>
        <div className='w-full max-w-5xl bg-white rounded-2xl p-8 shadow'>
          <h1 className='text-3xl font-bold text-slate-900'>AI Mock Interview</h1>
          <p className='text-slate-600 mt-2'>
            Configure your interview, answer by voice, and get AI feedback with detailed scoring.
          </p>

          {!currentSession && (
            <div className='grid md:grid-cols-3 gap-4 mt-8'>
              <label className='space-y-2'>
                <span className='text-sm font-semibold text-slate-700'>Job Role</span>
                <input
                  value={jobRole}
                  onChange={(event) => setJobRole(event.target.value)}
                  className='w-full border rounded-lg px-3 py-2'
                />
              </label>

              <label className='space-y-2'>
                <span className='text-sm font-semibold text-slate-700'>Experience</span>
                <select
                  value={experienceLevel}
                  onChange={(event) => setExperienceLevel(event.target.value as ExperienceLevel)}
                  className='w-full border rounded-lg px-3 py-2'
                >
                  {experienceLevels.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </label>

              <label className='space-y-2'>
                <span className='text-sm font-semibold text-slate-700'>Interview Type</span>
                <select
                  value={interviewType}
                  onChange={(event) => setInterviewType(event.target.value as InterviewType)}
                  className='w-full border rounded-lg px-3 py-2'
                >
                  {interviewTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {error && <p className='text-red-600 mt-4'>{error}</p>}

          {!currentSession && (
            <button
              disabled={busy}
              onClick={createSession}
              className='mt-6 px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-50'
            >
              {busy ? 'Generating Questions...' : 'Start Interview'}
            </button>
          )}
        </div>

        {currentSession && !isCompleted && currentQuestion && (
          <div className='w-full max-w-5xl bg-white rounded-2xl p-8 shadow space-y-6'>
            <div className='flex items-center justify-between'>
              <h2 className='text-xl font-semibold'>Question {currentQuestionIndex + 1} / {currentSession.questions.length}</h2>
              <button
                onClick={() => tts.speak(currentQuestion.text)}
                disabled={!tts.supported || tts.speaking}
                className='px-4 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-50'
              >
                {tts.speaking ? 'Playing...' : 'Play Question'}
              </button>
            </div>

            <p className='text-lg text-slate-800'>{currentQuestion.text}</p>

            <div className='flex flex-wrap gap-3'>
              <button
                onClick={() => recorder.startRecording()}
                disabled={busy || recorder.recording || !recorder.supported}
                className='px-4 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-50'
              >
                {recorder.recording ? 'Recording...' : 'Start Recording'}
              </button>

              <button
                onClick={submitAnswer}
                disabled={busy || !recorder.recording}
                className='px-4 py-2 rounded-lg bg-orange-500 text-white disabled:opacity-50'
              >
                Stop & Evaluate
              </button>

              <button
                onClick={nextStep}
                disabled={busy || !currentQuestion.transcript}
                className='px-4 py-2 rounded-lg bg-slate-900 text-white disabled:opacity-50'
              >
                {currentQuestionIndex < currentSession.questions.length - 1 ? 'Next Question' : 'Generate Final Report'}
              </button>
            </div>

            {!recorder.supported && (
              <p className='text-sm text-amber-700'>
                This browser does not support MediaRecorder. Try latest Chrome or Edge.
              </p>
            )}

            {currentQuestion.transcript && (
              <div className='bg-slate-50 rounded-xl p-4 space-y-2'>
                <h3 className='font-semibold'>Transcript</h3>
                <p className='text-slate-700'>{currentQuestion.transcript}</p>
                {currentQuestion.evaluation && (
                  <div className='grid md:grid-cols-3 gap-4 text-sm'>
                    <div><strong>Score:</strong> {currentQuestion.evaluation.score}/10</div>
                    <div><strong>Strengths:</strong> {currentQuestion.evaluation.strengths.join(', ') || 'N/A'}</div>
                    <div><strong>Improvements:</strong> {currentQuestion.evaluation.suggestions.join(', ') || 'N/A'}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {currentSession && isCompleted && (
          <div className='w-full max-w-5xl bg-white rounded-2xl p-8 shadow space-y-4'>
            <h2 className='text-2xl font-bold'>Final Report</h2>
            <p className='text-lg font-medium text-blue-700'>Overall Score: {currentSession.finalScore ?? 0}/10</p>
            <p className='text-slate-700'>{currentSession.finalFeedback}</p>

            {currentSession.questions.map((question, index) => (
              <article key={question._id} className='border rounded-lg p-4'>
                <h3 className='font-semibold mb-2'>Q{index + 1}: {question.text}</h3>
                <p><strong>Transcript:</strong> {question.transcript ?? 'No response recorded.'}</p>
                <p><strong>Score:</strong> {question.evaluation?.score ?? 0}/10</p>
              </article>
            ))}
          </div>
        )}

        <div className='w-full max-w-5xl bg-white rounded-2xl p-8 shadow'>
          <h2 className='text-2xl font-semibold mb-4'>Past Interviews</h2>
          {history.length === 0 ? (
            <p className='text-slate-600'>No past interview sessions yet.</p>
          ) : (
            <div className='space-y-3'>
              {history.map((session) => (
                <div key={session._id} className='border rounded-xl p-4 flex justify-between items-center'>
                  <div>
                    <p className='font-semibold'>{session.jobRole} • {session.interviewType}</p>
                    <p className='text-sm text-slate-600'>
                      {new Date(session.createdAt).toLocaleString()} • {session.experienceLevel}
                    </p>
                  </div>
                  <p className='font-semibold text-blue-700'>{session.finalScore ?? '-'} / 10</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
