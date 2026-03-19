import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Web Speech API helper for Text-to-Speech (TTS).
 * Reads interview questions out loud from the browser only.
 */
export function useSpeechSynthesis() {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
  }, []);

  const speak = useCallback((text: string) => {
    if (!supported) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  useEffect(() => stop, [stop]);

  return useMemo(() => ({ supported, speaking, speak, stop }), [supported, speaking, speak, stop]);
}
