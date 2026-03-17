import { requireUser } from '~/services/auth.server';
import { connectToMongo, getInterviewSessionById, saveInterviewSession } from '~/lib/interview-db.server';
import { buildFinalInterviewFeedback, evaluateInterviewAnswer } from '~/services/gemini-interview.server';
import { transcribeAudioWithAzure } from '~/services/azure-speech.server';

export async function loader() {
  return Response.json({ message: 'Use POST for interview answers.' }, { status: 405 });
}

export async function action({ request }: { request: Request }) {
  const userEmail = await requireUser(request);

  try {
    await connectToMongo();
    const formData = await request.formData();

    const sessionId = formData.get('sessionId')?.toString();
    const questionId = formData.get('questionId')?.toString();
    const audio = formData.get('audio');

    if (!sessionId || !questionId || !(audio instanceof File)) {
      return Response.json({ error: 'sessionId, questionId and audio are required.' }, { status: 400 });
    }

    const session = await getInterviewSessionById(sessionId, userEmail);
    if (!session) {
      return Response.json({ error: 'Interview session not found.' }, { status: 404 });
    }

    const question = session.questions.find((item) => item._id === questionId);
    if (!question) {
      return Response.json({ error: 'Question not found in session.' }, { status: 404 });
    }

    const audioBuffer = Buffer.from(await audio.arrayBuffer());

    // Graceful STT fallback: if Azure fails we keep flow alive with a placeholder transcript.
    let transcript = '';
    try {
      transcript = await transcribeAudioWithAzure({
        audioBuffer,
        mimeType: audio.type || 'audio/webm',
      });
    } catch (error) {
      console.error('Azure STT failed, fallback used.', error);
      transcript = 'Audio received, but transcription failed. Please retry this question.';
    }

    // Graceful Gemini fallback: provide default scoring payload if evaluation fails.
    let evaluation = {
      score: 0,
      strengths: ['Could not evaluate due to AI service issue.'],
      weaknesses: ['Evaluation service unavailable.'],
      improvements: ['Retry submission later for full analysis.'],
      feedback: 'Evaluation temporarily unavailable.',
    };

    try {
      evaluation = await evaluateInterviewAnswer({
        question: question.question,
        transcript,
        jobRole: session.jobRole,
        experienceLevel: session.experienceLevel,
      });
    } catch (error) {
      console.error('Gemini evaluation failed, fallback used.', error);
    }

    question.transcript = transcript;
    question.audioMimeType = audio.type || 'audio/webm';
    question.evaluation = evaluation;

    const allAnswered = session.questions.every((item) => Boolean(item.transcript));

    if (allAnswered) {
      try {
        const finalResult = await buildFinalInterviewFeedback({
          jobRole: session.jobRole,
          experienceLevel: session.experienceLevel,
          evaluations: session.questions.map((item) => ({
            score: item.evaluation?.score ?? 0,
            feedback: item.evaluation?.feedback ?? '',
          })),
        });

        session.overallScore = finalResult.overallScore;
        session.overallFeedback = finalResult.overallFeedback;
        session.status = 'completed';
      } catch (error) {
        console.error('Final Gemini scoring failed, fallback average used.', error);
        const scores = session.questions.map((item) => item.evaluation?.score ?? 0);
        const total = scores.reduce((sum: number, value: number) => sum + value, 0);
        session.overallScore = Number((total / Math.max(scores.length, 1)).toFixed(2));
        session.overallFeedback = 'Final feedback could not be generated, but individual evaluations are available.';
      }
    }

    await saveInterviewSession(session);

    return Response.json({
      transcript,
      evaluation,
      status: session.status,
      overallScore: session.overallScore,
      overallFeedback: session.overallFeedback,
    });
  } catch (error) {
    console.error('mock interview answer error', error);
    return Response.json(
      { error: 'Failed to process interview answer. Please retry.' },
      { status: 500 }
    );
  }
}
