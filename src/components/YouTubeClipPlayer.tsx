"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { youtubeEmbedUrl } from "@/lib/isThisAiSongs";
import { useServerClockAnchor } from "@/hooks/useServerClockAnchor";
import { msUntilServerTime } from "@/lib/serverClock";

interface YouTubeClipPlayerProps {
  youtubeVideoId: string;
  snippetStart: number;
  snippetDuration: number;
  roundStartTime: number;
  audioPlayAt: number;
  audioSyncing?: boolean;
  syncReadyCount?: number;
  syncTotalPlayers?: number;
  onAudioReady?: () => void;
}

const EQ_ANIMATIONS = [
  "animate-eq-1",
  "animate-eq-2",
  "animate-eq-3",
  "animate-eq-4",
  "animate-eq-5",
];

/**
 * Plays a YouTube clip as audio-only during guessing.
 * The iframe stays sized for reliable autoplay, but is fully covered —
 * no video or thumbnail is shown until reveal.
 */
export default function YouTubeClipPlayer({
  youtubeVideoId,
  snippetStart,
  snippetDuration,
  roundStartTime,
  audioPlayAt,
  audioSyncing = false,
  syncReadyCount = 0,
  syncTotalPlayers = 1,
  onAudioReady,
}: YouTubeClipPlayerProps) {
  const readySignaledRef = useRef(false);
  const [hasSynced, setHasSynced] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [embedSrc, setEmbedSrc] = useState<string | null>(null);
  const clockAnchor = useServerClockAnchor(roundStartTime);

  const signalSynced = useCallback(() => {
    if (readySignaledRef.current) return;
    readySignaledRef.current = true;
    setHasSynced(true);
    onAudioReady?.();
  }, [onAudioReady]);

  useEffect(() => {
    readySignaledRef.current = false;
    setHasSynced(false);
    setIsPlaying(false);
    setEmbedSrc(null);
  }, [youtubeVideoId]);

  useEffect(() => {
    if (!hasSynced || audioPlayAt <= 0) return;

    const delay = clockAnchor
      ? msUntilServerTime(clockAnchor, audioPlayAt)
      : Math.max(0, audioPlayAt - Date.now());

    const startTimeout = setTimeout(() => {
      setEmbedSrc(youtubeEmbedUrl(youtubeVideoId, snippetStart, snippetDuration));
      setIsPlaying(true);
    }, delay);

    const stopTimeout = setTimeout(
      () => {
        setIsPlaying(false);
        setEmbedSrc(null);
      },
      delay + snippetDuration * 1000 + 400
    );

    return () => {
      clearTimeout(startTimeout);
      clearTimeout(stopTimeout);
    };
  }, [
    hasSynced,
    audioPlayAt,
    clockAnchor,
    youtubeVideoId,
    snippetStart,
    snippetDuration,
  ]);

  const showTapPrompt = !hasSynced;
  const showWaiting = hasSynced && audioSyncing;

  const statusText = showTapPrompt
    ? `Tap to sync (${syncReadyCount}/${syncTotalPlayers})`
    : showWaiting
      ? `Waiting for players… (${syncReadyCount}/${syncTotalPlayers})`
      : isPlaying
        ? "Now Playing"
        : "Listen closely…";

  const playerContent = (
    <>
      {/* Sized iframe for autoplay; opaque cover hides all video cues */}
      <div className="relative w-full max-w-xs aspect-video rounded-2xl overflow-hidden bg-vinyl-surface ring-1 ring-vinyl-border">
        {embedSrc && (
          <iframe
            key={embedSrc}
            src={embedSrc}
            title="YouTube audio clip"
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          />
        )}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-vinyl-surface">
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl glass">
            <div className="relative flex-shrink-0">
              <div
                className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                  isPlaying
                    ? "bg-vinyl-accent"
                    : showTapPrompt || showWaiting
                      ? "bg-amber-400"
                      : "bg-gray-600"
                }`}
              />
              {isPlaying && (
                <span className="absolute inset-0 rounded-full bg-vinyl-accent animate-ping opacity-60" />
              )}
              {(showTapPrompt || showWaiting) && !isPlaying && (
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
                      : showTapPrompt || showWaiting
                        ? "bg-amber-400/70"
                        : "bg-gray-600"
                  }`}
                  style={{
                    height: isPlaying
                      ? "24px"
                      : showTapPrompt || showWaiting
                        ? "12px"
                        : "3px",
                  }}
                />
              ))}
            </div>

            <span
              className={`text-xs font-medium tracking-wide transition-colors duration-300 ${
                isPlaying
                  ? "text-vinyl-accent"
                  : showTapPrompt || showWaiting
                    ? "text-amber-400"
                    : "text-gray-500"
              }`}
            >
              {statusText}
            </span>
          </div>
          <p className="text-[11px] text-gray-500">Audio only</p>
        </div>
      </div>

      <p className="text-xs text-gray-500 text-center max-w-xs">
        {showTapPrompt
          ? "Everyone taps — the ~30s clip starts together."
          : showWaiting
            ? "Almost there — clip starts in a moment"
            : "Video reveals after everyone guesses."}
      </p>
    </>
  );

  return (
    <div className="flex flex-col items-center gap-3">
      {showTapPrompt ? (
        <button
          type="button"
          onClick={signalSynced}
          className="flex flex-col items-center gap-3 w-full touch-manipulation active:opacity-90"
          aria-label="Tap to sync clip with group"
        >
          {playerContent}
        </button>
      ) : (
        playerContent
      )}
    </div>
  );
}
