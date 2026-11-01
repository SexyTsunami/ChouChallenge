"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  playYoutubeIframe,
  startYoutubeInGesture,
  stopYoutubeIframe,
} from "@/lib/youtubeEmbed";

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
 * Tap to Sync starts the clip in a user gesture.
 * Tap to Play retries play WITHOUT letting taps reach YouTube chrome
 * (logo / Watch on YouTube would open the app and leave the game).
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
  const [hasStarted, setHasStarted] = useState(false);

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

  /** Load embed inside the current tap — this is what actually unlocks mobile audio. */
  const loadAndPlayInGesture = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return false;

    iframe.style.opacity = "1";
    // Never hand taps to YouTube — our overlay owns all interaction.
    iframe.style.pointerEvents = "none";

    const ok = startYoutubeInGesture(iframe, youtubeVideoId, {
      startSec: snippetStart,
      durationSec: snippetDuration,
      mute: false,
      autoplay: true,
      // controls=1 helps mobile autoplay succeed; overlay still blocks logo taps.
      controls: true,
    });
    if (!ok) return false;

    // Nudge play after the player boots (same gesture chain on most mobiles).
    window.setTimeout(() => playYoutubeIframe(iframe), 250);
    window.setTimeout(() => playYoutubeIframe(iframe), 700);

    scheduleStop();
    return true;
  }, [youtubeVideoId, snippetStart, snippetDuration, scheduleStop]);

  const handleSync = useCallback(() => {
    if (!readySignaledRef.current) {
      readySignaledRef.current = true;
      onAudioReady?.();
    }
    if (startedRef.current) return;
    if (!loadAndPlayInGesture()) return;

    startedRef.current = true;
    setHasStarted(true);
    onClipStarted?.();
  }, [onAudioReady, loadAndPlayInGesture, onClipStarted]);

  const handleTapToPlay = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // 1) Prefer commanding the already-loaded player (no full reload flicker).
    playYoutubeIframe(iframe);

    // 2) Also re-bind src in this gesture — reliable unmute/retry on iOS/Android
    //    when the first autoplay attempt was silent.
    loadAndPlayInGesture();
  }, [loadAndPlayInGesture]);

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
            className="absolute inset-0 z-10 flex items-center justify-center touch-manipulation active:opacity-90"
            aria-label="Tap to play"
          >
            <span
              className="text-lg font-bold drop-shadow"
              style={{ color: "#6ee7b7" }}
            >
              Tap to Play
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
