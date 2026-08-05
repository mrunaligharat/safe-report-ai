import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Web Speech API type declarations (not in standard TS lib) ──────────────

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

function getSpeechRecognitionClass(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

// ── Component ──────────────────────────────────────────────────────────────

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onTranscript, disabled = false }: VoiceRecorderProps) {
  // IMPORTANT: detect support in useEffect so it always runs on the client,
  // never during SSR where window is undefined.
  const [supported, setSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const [interim, setInterim] = useState("");
  const recRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    setSupported(getSpeechRecognitionClass() !== null);
  }, []);

  // Abort on unmount
  useEffect(() => {
    return () => {
      recRef.current?.abort();
    };
  }, []);

  const startRecording = useCallback(() => {
    const Ctor = getSpeechRecognitionClass();
    if (!Ctor) return;

    const rec = new Ctor();
    rec.lang = "en-IN";
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const finalText = result[0].transcript.trim();
          if (finalText) {
            onTranscript(finalText);
          }
          setInterim("");
        } else {
          interimTranscript += result[0].transcript;
        }
      }
      if (interimTranscript) setInterim(interimTranscript);
    };

    rec.onerror = () => {
      setRecording(false);
      setInterim("");
      recRef.current = null;
    };

    rec.onend = () => {
      setRecording(false);
      setInterim("");
      recRef.current = null;
    };

    recRef.current = rec;
    rec.start();
    setRecording(true);
    setInterim("");
  }, [onTranscript]);

  const stopRecording = useCallback(() => {
    recRef.current?.stop();
    // onend handler cleans up state
  }, []);

  // Don't render anything if browser doesn't support the API
  if (!supported) return null;

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={disabled}
        onClick={recording ? stopRecording : startRecording}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-2xl px-3 text-sm font-medium transition-colors",
          "disabled:pointer-events-none disabled:opacity-50",
          recording
            ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
            : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        )}
        aria-label={recording ? "Stop voice recording" : "Start voice input"}
      >
        {recording ? (
          <>
            <Square className="h-3.5 w-3.5 animate-pulse fill-current" aria-hidden="true" />
            Stop recording
          </>
        ) : (
          <>
            <Mic className="h-3.5 w-3.5" aria-hidden="true" />
            Voice input
          </>
        )}
      </button>

      {interim && (
        <p className="max-w-xs truncate text-right text-xs italic text-muted-foreground">
          {interim}…
        </p>
      )}
    </div>
  );
}
