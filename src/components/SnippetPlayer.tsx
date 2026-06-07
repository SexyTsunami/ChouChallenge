"use client";

import { useEffect, useRef, useState } from "react";
import { LOOP_PAUSE_MS, SNIPPET_LOOPS } from "@/types/game";

interface SnippetPlayerProps {
  previewUrl: string;
  snippetStart: number;
  snippetDuration: number;
  audioPlayAt: number;
  onComplete?: () => void;
}

const EQ_ANIMATIONS = [
  "animate-eq-1",
  "animate-eq-2",
  "animate-eq-3",
  "animate-eq-4",
  "animate-eq-5",
];

export default function SnippetPlayer({
  previewUrl,
  snippetStart,
  snippetDuration,
  audioPlayAt,
  onComplete,
}: SnippetPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLoop, setCurrentLoop] = useState(-1);

  useEffect(() => {
    const audio = new Audio(previewUrl);
    audio.preload = "auto";
    audioRef.current = audio;

    const clearAll = () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };

    const playLoop = (loopIndex: number) => {
      if (loopIndex >= SNIPPET_LOOPS) {
        setIsPlaying(false);
        onComplete?.();
        return;
      }

      setCurrentLoop(loopIndex);
      audio.currentTime = snippetStart;
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.error("audio.play() failed:", err);
          setIsPlaying(false);
        });

      const stopTimeout = setTimeout(() => {
        audio.pause();
        setIsPlaying(false);
        if (loopIndex < SNIPPET_LOOPS - 1) {
          const pauseTimeout = setTimeout(() => playLoop(loopIndex + 1), LOOP_PAUSE_MS);
          timeoutsRef.current.push(pauseTimeout);
        } else {
          onComplete?.();
        }
      }, snippetDuration * 1000);

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
  }, [previewUrl, snippetStart, snippetDuration, audioPlayAt, onComplete]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3 px-5 py-3 rounded-2xl glass">
        <div className="relative flex-shrink-0">
          <div
            className={`w-3 h-3 rounded-full transition-colors duration-300 ${
              isPlaying ? "bg-vinyl-accent" : "bg-gray-600"
            }`}
          />
          {isPlaying && (
            <span className="absolute inset-0 rounded-full bg-vinyl-accent animate-ping opacity-60" />
          )}
        </div>

        <div className="flex items-end gap-[3px] h-6 overflow-hidden">
          {EQ_ANIMATIONS.map((anim, i) => (
            <div
              key={i}
              className={`w-1.5 rounded-sm origin-bottom transition-colors duration-300 ${
                isPlaying ? `bg-vinyl-accent ${anim}` : "bg-gray-600"
              }`}
              style={{ height: isPlaying ? "24px" : "3px" }}
            />
          ))}
        </div>

        <span
          className={`text-xs font-medium tracking-wide transition-colors duration-300 ${
            isPlaying ? "text-vinyl-accent" : "text-gray-500"
          }`}
        >
          {isPlaying ? "Now Playing" : currentLoop === -1 ? "Get ready…" : "Paused"}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {Array.from({ length: SNIPPET_LOOPS }).map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              i < currentLoop
                ? "w-2 h-2 bg-vinyl-accent/50"
                : i === currentLoop
                  ? isPlaying
                    ? "w-3 h-3 bg-vinyl-accent shadow-[0_0_8px_rgba(29,185,84,0.7)]"
                    : "w-2 h-2 bg-vinyl-accent/40"
                  : "w-2 h-2 bg-gray-700"
            }`}
          />
        ))}
      </div>

      <p className="text-xs text-gray-500">
        {currentLoop >= 0
          ? `Loop ${Math.min(currentLoop + 1, SNIPPET_LOOPS)} of ${SNIPPET_LOOPS}`
          : "Listen closely…"}
      </p>
    </div>
  );
}
