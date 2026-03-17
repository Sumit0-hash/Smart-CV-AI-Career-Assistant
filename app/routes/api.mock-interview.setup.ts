import { requireUser } from '~/services/auth.server';
import { connectToMongo, createInterviewSession } from '~/lib/interview-db.server';
import { generateInterviewQuestions } from '~/services/gemini-interview.server';

export async function loader() {
  return Response.json({ message: 'Use POST for setup.' }, { status: 405 });
}

export async function action({ request }: { request: Request }) {
  const userEmail = await requireUser(request);

  try {
    await connectToMongo();
    const body = (await request.json()) as {
      jobRole?: string;
      experienceLevel?: string;
      interviewType?: 'Technical' | 'HR' | 'Mixed';
    };

    if (!body.jobRole || !body.experienceLevel || !body.interviewType) {
      return Response.json({ error: 'Missing required setup fields.' }, { status: 400 });
    }

    const generated = await generateInterviewQuestions({
      jobRole: body.jobRole,
      experienceLevel: body.experienceLevel,
      interviewType: body.interviewType,
    });

    const session = await createInterviewSession({
      userId: userEmail,
      jobRole: body.jobRole,
      experienceLevel: body.experienceLevel,
      interviewType: body.interviewType,
      questions: generated.map((item) => item.question),
    });

    return Response.json({ sessionId: session._id, questions: session.questions });
  } catch (error) {
    console.error('mock interview setup error', error);
    return Response.json(
      { error: 'Failed to setup interview. Please retry in a moment.' },
      { status: 500 }
    );
  }
}
