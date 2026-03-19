import { useCallback, useMemo, useRef, useState } from 'react';

/**
 * MediaRecorder wrapper for recording interview answers from microphone.
 */
export function useAudioRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const [supported] = useState(
    typeof window !== 'undefined' &&
      'MediaRecorder' in window &&
      navigator.mediaDevices !== undefined,
  );

  const startRecording = useCallback(async () => {
    if (!supported) {
      throw new Error('MediaRecorder API is not supported in this browser.');
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      setRecording(false);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setRecording(true);
  }, [supported]);

  const stopRecording = useCallback(async (): Promise<Blob> => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      throw new Error('No active recording found.');
    }

    return new Promise((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        recorder.stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
        resolve(blob);
      };

      recorder.stop();
    });
  }, []);

  return useMemo(
    () => ({ supported, recording, startRecording, stopRecording }),
    [supported, recording, startRecording, stopRecording],
  );
}
