import axios from 'axios';
import { env } from '../config/env.js';

const assemblyClient = axios.create({
  baseURL: 'https://api.assemblyai.com/v2',
  headers: {
    authorization: env.assemblyAiApiKey,
  },
});

/**
 * AssemblyAI async Speech-to-Text integration.
 * Uploads the recorded blob and polls transcription completion.
 */
export async function transcribeAudio(audioBuffer: Buffer) {
  const uploadResponse = await assemblyClient.post<{ upload_url: string }>(
    '/upload',
    audioBuffer,
    {
      headers: {
        'content-type': 'application/octet-stream',
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    },
  );

  const transcriptResponse = await assemblyClient.post<{ id: string }>('/transcript', {
    audio_url: uploadResponse.data.upload_url,
  });

  const transcriptId = transcriptResponse.data.id;

  for (let attempt = 0; attempt < 25; attempt += 1) {
    const pollResponse = await assemblyClient.get<{
      status: 'queued' | 'processing' | 'completed' | 'error';
      text?: string;
      error?: string;
    }>(`/transcript/${transcriptId}`);

    if (pollResponse.data.status === 'completed') {
      return pollResponse.data.text ?? '';
    }

    if (pollResponse.data.status === 'error') {
      throw new Error(pollResponse.data.error ?? 'AssemblyAI transcription failed.');
    }

    await new Promise((resolve) => setTimeout(resolve, 1200));
  }

  throw new Error('AssemblyAI transcription timed out.');
}
