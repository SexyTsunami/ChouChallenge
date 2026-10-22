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
 * One green Sync & play surface (the media rectangle is the button).
 * Video stays heavily blurred while playing.
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
  const [isPlaying, setIsPlaying] = useState(false);

  const clearStopTimer = () => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
  };

  const startClip = useCallback(() => {
    if (startedRef.current) return;
    const iframe = iframeRef.current;
    if (!iframe) return;

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

    startedRef.current = true;
    setIsPlaying(true);
    onClipStarted?.();

    clearStopTimer();
    stopTimerRef.current = setTimeout(() => {
      setIsPlaying(false);
      stopYoutubeIframe(iframeRef.current);
    }, snippetDuration * 1000 + 800);
  }, [youtubeVideoId, snippetStart, snippetDuration, onClipStarted]);

  const handleSyncAndPlay = useCallback(() => {
    if (!readySignaledRef.current) {
      readySignaledRef.current = true;
      onAudioReady?.();
    }
    startClip();
  }, [onAudioReady, startClip]);

  useEffect(() => {
    readySignaledRef.current = false;
    startedRef.current = false;
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

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <div className="relative w-full max-w-xs aspect-video rounded-2xl overflow-hidden ring-1 ring-vinyl-border">
        <iframe
          ref={iframeRef}
          title="YouTube audio clip"
          tabIndex={-1}
          className="absolute inset-0 w-full h-full border-0"
          style={{
            opacity: isPlaying ? 1 : 0,
            filter: isPlaying ? "blur(40px) brightness(0.35) saturate(0.5)" : undefined,
            pointerEvents: isPlaying ? "auto" : "none",
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
        />

        {!isPlaying ? (
          <button
            type="button"
            onClick={handleSyncAndPlay}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 bg-vinyl-accent text-black touch-manipulation active:brightness-95"
            aria-label="Tap to sync"
          >
            <span className="text-lg font-bold">Tap to Sync</span>
            <span className="text-xs font-semibold opacity-80">
              ({syncReadyCount}/{syncTotalPlayers})
            </span>
          </button>
        ) : (
          <>
            <div className="absolute inset-0 z-[1] bg-black/25 pointer-events-none" />
            <p className="absolute inset-0 z-10 flex items-center justify-center text-center text-lg font-bold text-white pointer-events-none drop-shadow">
              Tap to Play
            </p>
          </>
        )}
      </div>
    </div>
  );
}
