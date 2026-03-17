import { requireUser } from '~/services/auth.server';
import { connectToMongo, getInterviewSessionById } from '~/lib/interview-db.server';

export async function loader({ request, params }: { request: Request; params: { sessionId: string } }) {
  const userEmail = await requireUser(request);

  try {
    await connectToMongo();

    const session = await getInterviewSessionById(params.sessionId, userEmail);

    if (!session) {
      return Response.json({ error: 'Interview session not found.' }, { status: 404 });
    }

    return Response.json(session);
  } catch (error) {
    console.error('mock interview report error', error);
    return Response.json({ error: 'Failed to load interview report.' }, { status: 500 });
  }
}
