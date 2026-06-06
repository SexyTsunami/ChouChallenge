"use client";

import { useEffect, useRef } from "react";
import { LOOP_PAUSE_MS, SNIPPET_LOOPS } from "@/types/game";

interface SnippetPlayerProps {
  audioUrl: string;
  snippetDuration: number;
  audioPlayAt: number;
  onComplete?: () => void;
}

export default function SnippetPlayer({
  audioUrl,
  snippetDuration,
  audioPlayAt,
  onComplete,
}: SnippetPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audio.preload = "auto";
    audioRef.current = audio;

    const clearAll = () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };

    const playLoop = (loopIndex: number) => {
      if (loopIndex >= SNIPPET_LOOPS) {
        onComplete?.();
        return;
      }

      audio.currentTime = 0;
      audio.play().catch(console.error);

      const durationMs = snippetDuration * 1000;
      const stopTimeout = setTimeout(() => {
        audio.pause();
        if (loopIndex < SNIPPET_LOOPS - 1) {
          const pauseTimeout = setTimeout(() => playLoop(loopIndex + 1), LOOP_PAUSE_MS);
          timeoutsRef.current.push(pauseTimeout);
        } else {
          onComplete?.();
        }
      }, durationMs);

      timeoutsRef.current.push(stopTimeout);
    };

    const delay = Math.max(0, audioPlayAt - Date.now());
    const startTimeout = setTimeout(() => playLoop(0), delay);
    timeoutsRef.current.push(startTimeout);

    return () => {
      clearAll();
      audio.pause();
      audio.src = "";
    };
  }, [audioUrl, snippetDuration, audioPlayAt, onComplete]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        {[...Array(SNIPPET_LOOPS)].map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-vinyl-accent animate-pulse-glow"
            style={{ animationDelay: `${i * 0.3}s` }}
          />
        ))}
      </div>
      <p className="text-sm text-gray-400">Listen closely…</p>
    </div>
  );
}
