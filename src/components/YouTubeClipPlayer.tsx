"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { youtubeEmbedUrl, stopYoutubeIframe } from "@/lib/youtubeEmbed";

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
 * Mobile-first: Sync → Play.
 * Play creates the iframe inside the tap (required for iOS sound) and keeps an
 * overlay on top so a second tap never hits YouTube's own play button.
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
  const frameHostRef = useRef<HTMLDivElement | null>(null);
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

  const clearFrame = () => {
    if (iframeRef.current) {
      stopYoutubeIframe(iframeRef.current);
      iframeRef.current.remove();
      iframeRef.current = null;
    }
    if (frameHostRef.current) {
      frameHostRef.current.innerHTML = "";
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
    clearFrame();
  }, [youtubeVideoId]);

  useEffect(() => {
    return () => {
      clearStopTimer();
      clearFrame();
    };
  }, []);

  const handlePlayClip = useCallback(() => {
    if (clipStarted) return;
    const host = frameHostRef.current;
    if (!host) return;

    // Build the iframe inside this tap — most reliable path for mobile sound.
    clearFrame();
    const iframe = document.createElement("iframe");
    iframe.title = "YouTube audio clip";
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.setAttribute(
      "style",
      [
        "position:absolute",
        "inset:0",
        "width:100%",
        "height:100%",
        "border:0",
        "pointer-events:none",
        "filter:blur(30px) brightness(0.4)",
      ].join(";")
    );
    iframe.src = youtubeEmbedUrl(youtubeVideoId, {
      startSec: snippetStart,
      durationSec: snippetDuration,
      mute: false,
      autoplay: true,
      controls: false,
    });
    host.appendChild(iframe);
    iframeRef.current = iframe;

    setClipStarted(true);
    setIsPlaying(true);
    onClipStarted?.();

    clearStopTimer();
    stopTimerRef.current = setTimeout(() => {
      setIsPlaying(false);
      clearFrame();
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
      {/* Compact media well — only grows when playing */}
      <div
        className={`relative w-full max-w-xs overflow-hidden rounded-2xl bg-black ring-1 ring-vinyl-border ${
          isPlaying ? "aspect-video" : "h-14"
        }`}
      >
        <div ref={frameHostRef} className="absolute inset-0" />
        {/* Always cover the iframe so taps never hit YouTube UI */}
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-vinyl-surface/90 pointer-events-none">
          <p
            className={`font-medium ${
              isPlaying ? "text-vinyl-accent text-sm" : "text-gray-400 text-xs"
            }`}
          >
            {isPlaying
              ? "Now playing — listen & guess"
              : showWaiting
                ? "Synced — waiting for Play…"
                : showPlay
                  ? "Tap Play clip below"
                  : "Audio only"}
          </p>
        </div>
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

      <p className="text-xs text-gray-500 text-center max-w-xs">
        {showSync
          ? "Sync first — the timer starts when you hit Play."
          : showWaiting
            ? "Almost there…"
            : showPlay
              ? "Play starts the clip and the round timer."
              : "Guess AI or Human."}
      </p>
    </div>
  );
}
