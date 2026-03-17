import { requireUser } from '~/services/auth.server';
import { synthesizeTextWithAzure } from '~/services/azure-speech.server';

export async function loader() {
  return Response.json({ message: 'Use POST for TTS.' }, { status: 405 });
}

export async function action({ request }: { request: Request }) {
  await requireUser(request);

  try {
    const body = (await request.json()) as { text?: string };

    if (!body.text) {
      return Response.json({ error: 'Text is required for TTS.' }, { status: 400 });
    }

    const audio = await synthesizeTextWithAzure({ text: body.text });
    return Response.json(audio);
  } catch (error) {
    console.error('mock interview tts error', error);
    return Response.json({ error: 'Failed to synthesize speech.' }, { status: 500 });
  }
}
