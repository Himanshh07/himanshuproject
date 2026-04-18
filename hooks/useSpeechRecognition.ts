"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Browser type augmentation for SpeechRecognition                    */
/* ------------------------------------------------------------------ */
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */
interface UseSpeechRecognitionOptions {
  /** Language code, defaults to "en-US" */
  lang?: string;
  /** Called with interim transcript as user speaks */
  onInterim?: (text: string) => void;
  /** Called with final transcript when speech is done */
  onFinal?: (text: string) => void;
  /** Called when an error occurs */
  onError?: (error: string) => void;
}

interface UseSpeechRecognitionReturn {
  /** Whether the browser supports speech recognition */
  supported: boolean;
  /** Whether recognition is currently active */
  listening: boolean;
  /** Current interim transcript */
  transcript: string;
  /** Start listening */
  start: () => void;
  /** Stop listening */
  stop: () => void;
  /** Toggle listening on/off */
  toggle: () => void;
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {},
): UseSpeechRecognitionReturn {
  const { lang = "en-US", onInterim, onFinal, onError } = options;

  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onInterimRef = useRef(onInterim);
  const onFinalRef = useRef(onFinal);
  const onErrorRef = useRef(onError);
  /** Pending network-error retries — when > 0, onend will auto-restart */
  const pendingRetryRef = useRef(0);
  const MAX_NETWORK_RETRIES = 3;
  const lastErrorRef = useRef<string | null>(null);
  const SpeechRecognitionCtorRef = useRef<(new () => SpeechRecognitionInstance) | null>(null);

  // Keep callback refs fresh
  useEffect(() => {
    onInterimRef.current = onInterim;
    onFinalRef.current = onFinal;
    onErrorRef.current = onError;
  }, [onInterim, onFinal, onError]);

  /** Build (or rebuild) a fresh SpeechRecognition instance */
  const createRecognition = useCallback(() => {
    const Ctor = SpeechRecognitionCtorRef.current;
    if (!Ctor) return null;

    const recognition = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      pendingRetryRef.current = 0;
      lastErrorRef.current = null;
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (interim) {
        setTranscript(interim);
        onInterimRef.current?.(interim);
      }

      if (final) {
        setTranscript(final);
        onFinalRef.current?.(final);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "aborted" || event.error === "no-speech") {
        return; // onend will handle cleanup
      }

      if (event.error === "network") {
        if (pendingRetryRef.current < MAX_NETWORK_RETRIES) {
          pendingRetryRef.current++;
          lastErrorRef.current = "network";
          // Don't show error yet — onend will auto-retry
          return;
        }
        // Exhausted retries
        pendingRetryRef.current = 0;
        lastErrorRef.current = null;
        onErrorRef.current?.(
          "Voice input blocked — please disable your ad blocker or browser extensions and try again. This app works best in a standard browser without content blockers.",
        );
        return;
      }

      lastErrorRef.current = null;
      pendingRetryRef.current = 0;

      let message: string;
      switch (event.error) {
        case "not-allowed":
          message = "Microphone access denied. Please allow microphone permissions.";
          break;
        case "audio-capture":
          message = "No microphone detected. Please check your audio input.";
          break;
        default:
          message = `Speech recognition error: ${event.error}`;
      }

      onErrorRef.current?.(message);
    };

    recognition.onend = () => {
      // If a network retry is pending, create a fresh instance and restart
      if (lastErrorRef.current === "network" && pendingRetryRef.current > 0) {
        const delay = 500 * pendingRetryRef.current;
        setTimeout(() => {
          const fresh = createRecognition();
          if (fresh) {
            recognitionRef.current = fresh;
            try {
              fresh.start();
            } catch {
              setListening(false);
            }
          } else {
            setListening(false);
          }
        }, delay);
        return; // keep `listening` true to avoid UI flicker
      }

      setListening(false);
    };

    return recognition;
  }, [lang]);

  // Check support & create initial instance
  useEffect(() => {
    const SpeechRecognitionCtor =
      (window as unknown as Record<string, unknown>).SpeechRecognition ??
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setSupported(false);
      return;
    }

    setSupported(true);
    SpeechRecognitionCtorRef.current = SpeechRecognitionCtor as new () => SpeechRecognitionInstance;

    const recognition = createRecognition();
    recognitionRef.current = recognition;

    return () => {
      pendingRetryRef.current = 0;
      lastErrorRef.current = null;
      recognition?.abort();
      recognitionRef.current = null;
    };
  }, [createRecognition]);

  const start = useCallback(() => {
    if (listening) return;
    if (!SpeechRecognitionCtorRef.current) return;
    // Always create a fresh instance to avoid stale state after errors
    pendingRetryRef.current = 0;
    lastErrorRef.current = null;
    const fresh = createRecognition();
    if (!fresh) return;
    recognitionRef.current = fresh;
    setTranscript("");
    try {
      fresh.start();
    } catch {
      // Already started — ignore
    }
  }, [listening, createRecognition]);

  const stop = useCallback(() => {
    if (!recognitionRef.current || !listening) return;
    recognitionRef.current.stop();
  }, [listening]);

  const toggle = useCallback(() => {
    if (listening) {
      stop();
    } else {
      start();
    }
  }, [listening, start, stop]);

  return { supported, listening, transcript, start, stop, toggle };
}
