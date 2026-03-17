import { requireUser } from '~/services/auth.server';
import { connectToMongo, listInterviewSessions } from '~/lib/interview-db.server';

export async function loader({ request }: { request: Request }) {
  const userEmail = await requireUser(request);

  try {
    await connectToMongo();
    const sessions = await listInterviewSessions(userEmail);
    return Response.json({
      sessions: sessions.map((item) => ({
        _id: item._id,
        jobRole: item.jobRole,
        experienceLevel: item.experienceLevel,
        interviewType: item.interviewType,
        status: item.status,
        overallScore: item.overallScore,
        createdAt: item.createdAt,
      })),
    });
  } catch (error) {
    console.error('mock interview sessions error', error);
    return Response.json({ error: 'Failed to load past interviews.' }, { status: 500 });
  }
}
