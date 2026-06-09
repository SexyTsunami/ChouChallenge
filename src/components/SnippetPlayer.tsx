"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getSharedAudio,
  isGameAudioUnlocked,
  loadGameAudioSource,
  unlockGameAudio,
} from "@/lib/gameAudio";
import { useServerClockAnchor } from "@/hooks/useServerClockAnchor";
import { msUntilServerTime } from "@/lib/serverClock";
import { LOOP_PAUSE_MS, SNIPPET_LOOPS } from "@/types/game";

interface SnippetPlayerProps {
  previewUrl: string;
  snippetStart: number;
  snippetDuration: number;
  roundStartTime: number;
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
  roundStartTime,
  audioPlayAt,
  audioSyncing = false,
  syncReadyCount = 0,
  syncTotalPlayers = 1,
  onAudioReady,
  onComplete,
}: SnippetPlayerProps) {
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const readySignaledRef = useRef(false);
  const loopIndexRef = useRef(0);
  const playLoopRef = useRef<(loopIndex: number) => void>(() => {});

  const [isLoaded, setIsLoaded] = useState(false);
  const [hasSynced, setHasSynced] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLoop, setCurrentLoop] = useState(-1);
  const [playbackFailed, setPlaybackFailed] = useState(false);
  const clockAnchor = useServerClockAnchor(roundStartTime);

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  const signalSynced = useCallback(() => {
    if (readySignaledRef.current) return;
    readySignaledRef.current = true;
    setHasSynced(true);
    setPlaybackFailed(false);
    onAudioReady?.();
  }, [onAudioReady]);

  /** Every player (host + mobile) must tap so nobody gets a head start. */
  const handleSyncTap = useCallback(async () => {
    const unlocked = await unlockGameAudio();
    if (!unlocked) {
      setPlaybackFailed(true);
      return;
    }
    signalSynced();
    if (audioPlayAt > 0 && !isPlaying) {
      playLoopRef.current(loopIndexRef.current >= 0 ? loopIndexRef.current : 0);
    }
  }, [audioPlayAt, isPlaying, signalSynced]);

  // Preload into the shared session audio element (no server signal until tap).
  useEffect(() => {
    readySignaledRef.current = false;
    loopIndexRef.current = 0;
    setIsLoaded(false);
    setHasSynced(false);
    setIsPlaying(false);
    setCurrentLoop(-1);
    setPlaybackFailed(false);

    const audio = loadGameAudioSource(previewUrl);

    const onCanPlay = () => setIsLoaded(true);

    audio.addEventListener("canplaythrough", onCanPlay);
    if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      onCanPlay();
    }

    return () => {
      audio.removeEventListener("canplaythrough", onCanPlay);
      clearAllTimeouts();
      audio.pause();
    };
  }, [previewUrl, clearAllTimeouts]);

  // Start synced playback once the server sets audioPlayAt.
  useEffect(() => {
    if (!isLoaded || !hasSynced || audioPlayAt <= 0) return;

    const audio = getSharedAudio();

    const playLoop = (loopIndex: number) => {
      loopIndexRef.current = loopIndex;

      if (loopIndex >= SNIPPET_LOOPS) {
        setIsPlaying(false);
        onComplete?.();
        return;
      }

      setCurrentLoop(loopIndex);
      audio.currentTime = snippetStart;
      audio
        .play()
        .then(() => {
          setPlaybackFailed(false);
          setIsPlaying(true);
        })
        .catch((err) => {
          console.error("audio.play() failed:", err);
          setIsPlaying(false);
          setPlaybackFailed(true);
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

    playLoopRef.current = playLoop;
    clearAllTimeouts();

    const delay = clockAnchor
      ? msUntilServerTime(clockAnchor, audioPlayAt)
      : Math.max(0, audioPlayAt - Date.now());
    const startTimeout = setTimeout(() => {
      if (!isGameAudioUnlocked()) return;
      playLoop(loopIndexRef.current >= 0 ? loopIndexRef.current : 0);
    }, delay);
    timeoutsRef.current.push(startTimeout);

    return clearAllTimeouts;
  }, [
    isLoaded,
    hasSynced,
    roundStartTime,
    audioPlayAt,
    clockAnchor,
    snippetStart,
    snippetDuration,
    onComplete,
    clearAllTimeouts,
  ]);

  const awaitingSync = isLoaded && !hasSynced;
  const needsRetry = playbackFailed;
  const showTapPrompt = awaitingSync || needsRetry;
  const showLoading = !isLoaded;

  const statusText = showTapPrompt
    ? needsRetry
      ? "Tap to re-sync audio"
      : `Tap to sync (${syncReadyCount}/${syncTotalPlayers})`
    : showLoading
      ? "Loading preview…"
      : audioSyncing
        ? `Waiting for players… (${syncReadyCount}/${syncTotalPlayers})`
        : isPlaying
          ? "Now Playing"
          : currentLoop === -1
            ? "Get ready…"
            : "Paused";

  const playerContent = (
    <>
      <div className="flex items-center gap-3 px-5 py-3 rounded-2xl glass">
        <div className="relative flex-shrink-0">
          <div
            className={`w-3 h-3 rounded-full transition-colors duration-300 ${
              isPlaying
                ? "bg-vinyl-accent"
                : showLoading || showTapPrompt
                  ? "bg-amber-400"
                  : "bg-gray-600"
            }`}
          />
          {isPlaying && (
            <span className="absolute inset-0 rounded-full bg-vinyl-accent animate-ping opacity-60" />
          )}
          {(showLoading || showTapPrompt) && !isPlaying && (
            <span className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-40" />
          )}
        </div>

        <div className="flex items-end gap-[3px] h-6 overflow-hidden">
          {EQ_ANIMATIONS.map((anim, i) => (
            <div
              key={i}
              className={`w-1.5 rounded-sm origin-bottom transition-colors duration-300 ${
                isPlaying
                  ? `bg-vinyl-accent ${anim}`
                  : showLoading || showTapPrompt
                    ? "bg-amber-400/70"
                    : "bg-gray-600"
              }`}
              style={{
                height: isPlaying ? "24px" : showLoading || showTapPrompt ? "12px" : "3px",
              }}
            />
          ))}
        </div>

        <span
          className={`text-xs font-medium tracking-wide transition-colors duration-300 ${
            isPlaying
              ? "text-vinyl-accent"
              : showLoading || showTapPrompt
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

      <p className="text-xs text-gray-500 text-center max-w-xs">
        {showTapPrompt
          ? "Everyone taps — snippets start together once all players are synced."
          : showLoading
            ? "Loading preview for this round…"
            : audioSyncing
              ? "Almost there — snippets start in a moment"
              : currentLoop >= 0
                ? `Loop ${Math.min(currentLoop + 1, SNIPPET_LOOPS)} of ${SNIPPET_LOOPS}`
                : "Listen closely…"}
      </p>
    </>
  );

  return (
    <div className="flex flex-col items-center gap-4">
      {showTapPrompt ? (
        <button
          type="button"
          onClick={() => void handleSyncTap()}
          className="flex flex-col items-center gap-4 w-full touch-manipulation active:opacity-90"
          aria-label="Tap to sync audio with group"
        >
          {playerContent}
        </button>
      ) : (
        playerContent
      )}
    </div>
  );
}
