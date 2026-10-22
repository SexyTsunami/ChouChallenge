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
  onClipStarted?: () => void;
}

/**
 * Sync → Play. Loads the YouTube embed on Play (with controls).
 * On phones, autoplay may stay paused — tap the video play button once if silent.
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
  onClipStarted,
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

    // Make the embed visible before setting src (helps mobile playback).
    iframe.style.opacity = "1";
    iframe.style.pointerEvents = "auto";

    const ok = startYoutubeInGesture(iframe, youtubeVideoId, {
      startSec: snippetStart,
      durationSec: snippetDuration,
      mute: false,
      autoplay: true,
      controls: true,
    });
    if (!ok) return;

    setClipStarted(true);
    setIsPlaying(true);
    onClipStarted?.();

    clearStopTimer();
    stopTimerRef.current = setTimeout(() => {
      setIsPlaying(false);
      stopYoutubeIframe(iframeRef.current);
    }, snippetDuration * 1000 + 800);
  }, [
    clipStarted,
    youtubeVideoId,
    snippetStart,
    snippetDuration,
    onClipStarted,
  ]);

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
            // Allow tapping YouTube's play control if autoplay stays paused.
            pointerEvents: isPlaying ? "auto" : "none",
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
        />

        {!isPlaying && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 bg-vinyl-surface pointer-events-none">
            <p className="text-sm font-medium text-gray-300">
              {showSync
                ? "Sync to start"
                : showWaiting
                  ? "Synced — waiting…"
                  : showPlay
                    ? "Ready — hit Play clip"
                    : clipStarted
                      ? "Clip finished"
                      : "Audio"}
            </p>
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
        <p className="text-xs text-gray-400 text-center max-w-xs">
          If there’s no sound, tap the ▶ on the video once.
        </p>
      )}

      <p className="text-xs text-gray-500 text-center max-w-xs">
        {showSync
          ? "Sync first — the timer starts when you hit Play."
          : showWaiting
            ? "Almost there…"
            : showPlay
              ? "Play loads the clip (timer starts)."
              : "Guess AI or Human."}
      </p>
    </div>
  );
}
