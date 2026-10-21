"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { startYoutubeInGesture, stopYoutubeIframe } from "@/lib/youtubeEmbed";

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

/**
 * Mobile-first clip player — one Sync button, then one Play button.
 * Iframe stays visible (blurred) so iOS will allow sound after the Play tap.
 */
export default function YouTubeClipPlayer({
  youtubeVideoId,
  snippetStart,
  snippetDuration,
  audioPlayAt,
  audioSyncing = false,
  syncReadyCount = 0,
  syncTotalPlayers = 1,
  onAudioReady,
}: YouTubeClipPlayerProps) {
  const readySignaledRef = useRef(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hasSynced, setHasSynced] = useState(false);
  const [clipStarted, setClipStarted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const clearStopTimer = () => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
  };

  const signalSynced = useCallback(() => {
    if (readySignaledRef.current) return;
    readySignaledRef.current = true;
    setHasSynced(true);
    onAudioReady?.();
  }, [onAudioReady]);

  useEffect(() => {
    readySignaledRef.current = false;
    setHasSynced(false);
    setClipStarted(false);
    setIsPlaying(false);
    clearStopTimer();
    stopYoutubeIframe(iframeRef.current);
  }, [youtubeVideoId]);

  useEffect(() => {
    return () => {
      clearStopTimer();
      stopYoutubeIframe(iframeRef.current);
    };
  }, []);

  const handlePlayClip = useCallback(() => {
    if (clipStarted) return;
    const iframe = iframeRef.current;
    if (!iframe) return;

    // iOS: video must be visible when play starts — set that before src.
    iframe.style.opacity = "1";

    const ok = startYoutubeInGesture(iframe, youtubeVideoId, {
      startSec: snippetStart,
      durationSec: snippetDuration,
      mute: false,
      autoplay: true,
      // Controls give a fallback unmute path if autoplay is still blocked.
      controls: true,
    });
    if (!ok) return;

    setClipStarted(true);
    setIsPlaying(true);

    clearStopTimer();
    stopTimerRef.current = setTimeout(() => {
      setIsPlaying(false);
      stopYoutubeIframe(iframeRef.current);
    }, snippetDuration * 1000 + 800);
  }, [clipStarted, youtubeVideoId, snippetStart, snippetDuration]);

  const showSync = !hasSynced;
  const showWaiting = hasSynced && (audioSyncing || audioPlayAt <= 0);
  const showPlay = hasSynced && !audioSyncing && audioPlayAt > 0 && !clipStarted;

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="relative w-full max-w-xs aspect-video rounded-2xl overflow-hidden bg-black ring-1 ring-vinyl-border">
        <iframe
          ref={iframeRef}
          title="YouTube audio clip"
          tabIndex={-1}
          className="absolute inset-0 w-full h-full border-0"
          style={{
            opacity: isPlaying ? 1 : 0,
            filter: isPlaying ? "blur(28px) brightness(0.45)" : undefined,
            // Never let YouTube steal taps / navigate away
            pointerEvents: isPlaying ? "auto" : "none",
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
        />

        {!isPlaying && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-vinyl-surface pointer-events-none">
            <p className="text-sm font-medium text-gray-300">
              {showSync
                ? "Ready when you are"
                : showWaiting
                  ? "Synced — waiting…"
                  : showPlay
                    ? "Ready to play"
                    : clipStarted
                      ? "Clip finished"
                      : "Audio only"}
            </p>
            <p className="text-[11px] text-gray-500">Video stays blurred while guessing</p>
          </div>
        )}
      </div>

      {showSync && (
        <button
          type="button"
          onClick={signalSynced}
          className="w-full max-w-xs py-4 rounded-full font-bold text-base btn-primary touch-manipulation"
        >
          Tap to sync ({syncReadyCount}/{syncTotalPlayers})
        </button>
      )}

      {showWaiting && (
        <p className="text-sm text-amber-400 animate-pulse">
          Waiting for players… ({syncReadyCount}/{syncTotalPlayers})
        </p>
      )}

      {showPlay && (
        <button
          type="button"
          onClick={handlePlayClip}
          className="w-full max-w-xs py-4 rounded-full font-bold text-base btn-primary touch-manipulation shadow-lg"
        >
          ▶ Play clip
        </button>
      )}

      {isPlaying && (
        <p className="text-sm text-vinyl-accent font-medium">Now playing — listen & guess</p>
      )}

      <p className="text-xs text-gray-500 text-center max-w-xs">
        {showSync
          ? "Tap Sync once, then Play when it appears."
          : showWaiting
            ? "Almost there…"
            : showPlay
              ? "Tap Play for sound (required on phones)."
              : "Guess AI or Human when you’re ready."}
      </p>
    </div>
  );
}
