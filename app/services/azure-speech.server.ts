interface AzureSpeechConfig {
  key: string;
  region: string;
}

function getAzureSpeechConfig(): AzureSpeechConfig {
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;

  if (!key || !region) {
    throw new Error('AZURE_SPEECH_KEY and AZURE_SPEECH_REGION must be configured.');
  }

  return { key, region };
}

// Azure STT integration: sends captured microphone audio to Azure Speech-to-Text REST endpoint.
export async function transcribeAudioWithAzure(input: {
  audioBuffer: Buffer;
  mimeType: string;
  language?: string;
}) {
  const { key, region } = getAzureSpeechConfig();
  const language = input.language ?? 'en-US';

  const url = `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${encodeURIComponent(language)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': key,
      'Content-Type': input.mimeType || 'audio/webm',
      Accept: 'application/json',
    },
    body: new Uint8Array(input.audioBuffer),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Azure STT failed: ${response.status} ${body}`);
  }

  const data = (await response.json()) as { DisplayText?: string };
  return data.DisplayText ?? '';
}

// Azure TTS integration: converts text question to playable MP3 (returned as base64 to client).
export async function synthesizeTextWithAzure(input: {
  text: string;
  voiceName?: string;
  language?: string;
}) {
  const { key, region } = getAzureSpeechConfig();
  const voiceName = input.voiceName ?? 'en-US-JennyNeural';
  const language = input.language ?? 'en-US';

  const ssml = `<speak version='1.0' xml:lang='${language}'><voice xml:lang='${language}' name='${voiceName}'>${input.text}</voice></speak>`;

  const url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': key,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
    },
    body: ssml,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Azure TTS failed: ${response.status} ${body}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return {
    mimeType: 'audio/mpeg',
    base64Audio: buffer.toString('base64'),
  };
}
