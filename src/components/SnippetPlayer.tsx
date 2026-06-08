"use client";

import { useEffect, useRef, useState } from "react";
import { LOOP_PAUSE_MS, SNIPPET_LOOPS } from "@/types/game";

interface SnippetPlayerProps {
  previewUrl: string;
  snippetStart: number;
  snippetDuration: number;
  audioPlayAt: number;
  audioSyncing?: boolean;
  syncReadyCount?: number;
  syncTotalPlayers?: number;
  onAudioReady?: () => void;
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
  audioSyncing = false,
  syncReadyCount = 0,
  syncTotalPlayers = 1,
  onAudioReady,
  onComplete,
}: SnippetPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const readySignaledRef = useRef(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLoop, setCurrentLoop] = useState(-1);

  // Preload audio and notify server when ready.
  useEffect(() => {
    readySignaledRef.current = false;
    setIsLoaded(false);
    setIsPlaying(false);
    setCurrentLoop(-1);

    const audio = new Audio(previewUrl);
    audio.preload = "auto";
    audioRef.current = audio;

    const signalReady = () => {
      setIsLoaded(true);
      if (!readySignaledRef.current) {
        readySignaledRef.current = true;
        onAudioReady?.();
      }
    };

    audio.addEventListener("canplaythrough", signalReady);
    if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      signalReady();
    }

    return () => {
      audio.removeEventListener("canplaythrough", signalReady);
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, [previewUrl, onAudioReady]);

  // Start playback once server sets a shared audioPlayAt timestamp.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isLoaded || audioPlayAt <= 0) return;

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

    clearAll();
    const delay = Math.max(0, audioPlayAt - Date.now());
    const startTimeout = setTimeout(() => playLoop(0), delay);
    timeoutsRef.current.push(startTimeout);

    return clearAll;
  }, [isLoaded, audioPlayAt, snippetStart, snippetDuration, onComplete]);

  const statusText = !isLoaded
    ? "Loading preview…"
    : audioSyncing
      ? `Syncing players… (${syncReadyCount}/${syncTotalPlayers})`
      : isPlaying
        ? "Now Playing"
        : currentLoop === -1
          ? "Get ready…"
          : "Paused";

  const showLoading = !isLoaded || audioSyncing;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3 px-5 py-3 rounded-2xl glass">
        <div className="relative flex-shrink-0">
          <div
            className={`w-3 h-3 rounded-full transition-colors duration-300 ${
              isPlaying ? "bg-vinyl-accent" : showLoading ? "bg-amber-400" : "bg-gray-600"
            }`}
          />
          {isPlaying && (
            <span className="absolute inset-0 rounded-full bg-vinyl-accent animate-ping opacity-60" />
          )}
          {showLoading && !isPlaying && (
            <span className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-40" />
          )}
        </div>

        <div className="flex items-end gap-[3px] h-6 overflow-hidden">
          {EQ_ANIMATIONS.map((anim, i) => (
            <div
              key={i}
              className={`w-1.5 rounded-sm origin-bottom transition-colors duration-300 ${
                isPlaying ? `bg-vinyl-accent ${anim}` : showLoading ? "bg-amber-400/70" : "bg-gray-600"
              }`}
              style={{ height: isPlaying ? "24px" : showLoading ? "12px" : "3px" }}
            />
          ))}
        </div>

        <span
          className={`text-xs font-medium tracking-wide transition-colors duration-300 ${
            isPlaying
              ? "text-vinyl-accent"
              : showLoading
                ? "text-amber-400"
                : "text-gray-500"
          }`}
        >
          {statusText}
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
        {showLoading
          ? "Please wait — everyone hears the snippets together"
          : currentLoop >= 0
            ? `Loop ${Math.min(currentLoop + 1, SNIPPET_LOOPS)} of ${SNIPPET_LOOPS}`
            : "Listen closely…"}
      </p>
    </div>
  );
}
