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

/** Min time between Tap to Play reloads — stops panic-taps from thrashing the embed. */
const RELOAD_COOLDOWN_MS = 1800;

/**
 * Sync starts the clip. After that, Tap to Play is OUR button (iframe never
 * receives taps) so YouTube logo / "Watch on YouTube" can't kick players out.
 * A second tap reloads the embed in-gesture when autoplay was silent.
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
  const lastLoadAtRef = useRef(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const clearStopTimer = () => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
  };

  const scheduleStop = useCallback(() => {
    clearStopTimer();
    stopTimerRef.current = setTimeout(() => {
      stopYoutubeIframe(iframeRef.current);
    }, snippetDuration * 1000 + 800);
  }, [snippetDuration]);

  const loadClipInGesture = useCallback(
    (announceStart: boolean) => {
      const iframe = iframeRef.current;
      if (!iframe) return false;

      const now = Date.now();
      if (now - lastLoadAtRef.current < RELOAD_COOLDOWN_MS) return false;
      lastLoadAtRef.current = now;

      // Never let the iframe take taps — YouTube chrome opens the app / leaves the game.
      iframe.style.opacity = "1";
      iframe.style.pointerEvents = "none";

      const ok = startYoutubeInGesture(iframe, youtubeVideoId, {
        startSec: snippetStart,
        durationSec: snippetDuration,
        mute: false,
        autoplay: true,
        // No native controls: logo / title / Watch on YouTube are the escape hatches.
        controls: false,
      });
      if (!ok) return false;

      const firstStart = !startedRef.current;
      startedRef.current = true;
      setHasStarted(true);
      setIsLoading(true);
      window.setTimeout(() => setIsLoading(false), RELOAD_COOLDOWN_MS);

      if (announceStart && firstStart) {
        onClipStarted?.();
      }

      scheduleStop();
      return true;
    },
    [youtubeVideoId, snippetStart, snippetDuration, onClipStarted, scheduleStop]
  );

  const handleSync = useCallback(() => {
    if (!readySignaledRef.current) {
      readySignaledRef.current = true;
      onAudioReady?.();
    }
    loadClipInGesture(true);
  }, [onAudioReady, loadClipInGesture]);

  const handleTapToPlay = useCallback(() => {
    // Reload in this gesture if audio never started — without touching YouTube UI.
    loadClipInGesture(false);
  }, [loadClipInGesture]);

  useEffect(() => {
    readySignaledRef.current = false;
    startedRef.current = false;
    lastLoadAtRef.current = 0;
    setHasStarted(false);
    setIsLoading(false);
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
            // Critical: never forward taps into YouTube (opens app / navigates away).
            pointerEvents: "none",
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
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
            disabled={isLoading}
            className="absolute inset-0 z-10 flex items-center justify-center touch-manipulation disabled:cursor-wait"
            aria-label="Tap to play"
          >
            <span
              className="text-lg font-bold drop-shadow"
              style={{ color: "#6ee7b7" }}
            >
              {isLoading ? "Loading…" : "Tap to Play"}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
