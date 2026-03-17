import type { Route } from './+types/mock-interview.report.$sessionId';
import Navbar from '~/components/Navbar';
import { requireUser } from '~/services/auth.server';
import { connectToMongo, getInterviewSessionById } from '~/lib/interview-db.server';

export async function loader({ request, params }: Route.LoaderArgs) {
  const userEmail = await requireUser(request);
  await connectToMongo();

  const session = await getInterviewSessionById(params.sessionId, userEmail);
  if (!session) throw new Response('Not found', { status: 404 });

  return { session };
}

export default function InterviewReport({ loaderData }: Route.ComponentProps) {
  const { session } = loaderData;

  return (
    <main className="bg-slate-50 min-h-screen">
      <Navbar />
      <section className="main-section py-8 space-y-6">
        <div className="page-heading">
          <h1>Interview Report</h1>
          <h2>{session.jobRole} • {session.experienceLevel} • {session.interviewType}</h2>
        </div>

        <div className="bg-white rounded-2xl border p-6">
          <p className="text-xl font-semibold">Overall Score: {session.overallScore ?? 0} / 10</p>
          <p className="text-slate-700 mt-2">{session.overallFeedback || 'Final feedback not available yet.'}</p>
        </div>

        <div className="space-y-4">
          {session.questions.map((item: any, index: number) => (
            <article key={item._id} className="bg-white rounded-2xl border p-6 space-y-2">
              <h3 className="font-semibold text-slate-900">Q{index + 1}. {item.question}</h3>
              <p className="text-sm"><strong>Transcript:</strong> {item.transcript || 'No answer submitted.'}</p>
              <p className="text-sm"><strong>Score:</strong> {item.evaluation?.score ?? 0} / 10</p>
              <p className="text-sm"><strong>Strengths:</strong> {(item.evaluation?.strengths ?? []).join(', ') || '-'}</p>
              <p className="text-sm"><strong>Weaknesses:</strong> {(item.evaluation?.weaknesses ?? []).join(', ') || '-'}</p>
              <p className="text-sm"><strong>Improvements:</strong> {(item.evaluation?.improvements ?? []).join(', ') || '-'}</p>
              <p className="text-sm"><strong>Feedback:</strong> {item.evaluation?.feedback || '-'}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
