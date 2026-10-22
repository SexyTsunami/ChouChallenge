"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { startYoutubeInGesture, stopYoutubeIframe } from "@/lib/youtubeEmbed";

interface YouTubeClipPlayerProps {
  youtubeVideoId: string;
  snippetStart: number;
  snippetDuration: number;
  syncReadyCount?: number;
  syncTotalPlayers?: number;
  onAudioReady?: () => void;
  onClipStarted?: () => void;
}

/**
 * Green "Tap to Sync" → then "Tap to Play" (different green).
 * Tap to Play is a real button that reloads the embed in a user gesture
 * (autoplay often fails on the first load for some videos).
 */
export default function YouTubeClipPlayer({
  youtubeVideoId,
  snippetStart,
  snippetDuration,
  syncReadyCount = 0,
  syncTotalPlayers = 1,
  onAudioReady,
  onClipStarted,
}: YouTubeClipPlayerProps) {
  const readySignaledRef = useRef(false);
  const startedRef = useRef(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Once true for this clip, never return to Tap to Sync. */
  const [hasStarted, setHasStarted] = useState(false);

  const clearStopTimer = () => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
  };

  /** Load/reload the embed inside a click gesture. */
  const loadClipInGesture = useCallback(
    (opts: { announceStart: boolean }) => {
      const iframe = iframeRef.current;
      if (!iframe) return false;

      iframe.style.opacity = "1";
      iframe.style.pointerEvents = "auto";

      // Bust cache / force a fresh player load so a second tap can recover
      // when the first autoplay attempt stalled (common on mobile).
      const ok = startYoutubeInGesture(iframe, youtubeVideoId, {
        startSec: snippetStart,
        durationSec: snippetDuration,
        mute: false,
        autoplay: true,
        controls: true,
      });
      if (!ok) return false;

      const firstStart = !startedRef.current;
      startedRef.current = true;
      setHasStarted(true);

      if (opts.announceStart && firstStart) {
        onClipStarted?.();
      }

      clearStopTimer();
      stopTimerRef.current = setTimeout(() => {
        stopYoutubeIframe(iframeRef.current);
      }, snippetDuration * 1000 + 800);

      return true;
    },
    [youtubeVideoId, snippetStart, snippetDuration, onClipStarted]
  );

  const handleSync = useCallback(() => {
    if (!readySignaledRef.current) {
      readySignaledRef.current = true;
      onAudioReady?.();
    }
    loadClipInGesture({ announceStart: true });
  }, [onAudioReady, loadClipInGesture]);

  /** Second-chance play: always reload embed in this gesture; do not re-fire timer. */
  const handleTapToPlay = useCallback(() => {
    loadClipInGesture({ announceStart: false });
  }, [loadClipInGesture]);

  useEffect(() => {
    readySignaledRef.current = false;
    startedRef.current = false;
    setHasStarted(false);
    clearStopTimer();
    stopYoutubeIframe(iframeRef.current);
  }, [youtubeVideoId]);

  useEffect(() => {
    return () => {
      clearStopTimer();
      stopYoutubeIframe(iframeRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <div className="relative w-full max-w-xs aspect-video rounded-2xl overflow-hidden ring-1 ring-vinyl-border">
        <iframe
          ref={iframeRef}
          title="YouTube audio clip"
          tabIndex={-1}
          className="absolute inset-0 w-full h-full border-0"
          style={{
            opacity: hasStarted ? 1 : 0,
            filter: hasStarted ? "blur(40px) brightness(0.35) saturate(0.5)" : undefined,
            pointerEvents: "none",
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
        />

        {!hasStarted ? (
          <button
            type="button"
            onClick={handleSync}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 bg-vinyl-accent text-black touch-manipulation active:brightness-95"
            aria-label="Tap to sync"
          >
            <span className="text-lg font-bold">Tap to Sync</span>
            <span className="text-xs font-semibold opacity-80">
              ({syncReadyCount}/{syncTotalPlayers})
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleTapToPlay}
            className="absolute inset-0 z-10 flex items-center justify-center touch-manipulation active:brightness-95"
            aria-label="Tap to play"
            style={{ background: "rgba(16, 185, 129, 0.35)" }}
          >
            <span className="text-lg font-bold drop-shadow" style={{ color: "#6ee7b7" }}>
              Tap to Play
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
