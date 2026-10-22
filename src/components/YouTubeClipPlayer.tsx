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
 * One button: sync + start the clip in the same tap.
 * Video stays heavily blurred; YouTube controls remain tappable if sound needs a nudge.
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
  const [hasSynced, setHasSynced] = useState(false);
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
      setHasSynced(true);
      onAudioReady?.();
    }
    // Same tap: start audio immediately (needed for mobile sound unlock).
    startClip();
  }, [onAudioReady, startClip]);

  useEffect(() => {
    readySignaledRef.current = false;
    startedRef.current = false;
    setHasSynced(false);
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
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="relative w-full max-w-xs aspect-video rounded-2xl overflow-hidden bg-black ring-1 ring-vinyl-border">
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

        {!isPlaying && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-vinyl-surface pointer-events-none">
            <p className="text-sm font-medium text-gray-400">
              {hasSynced ? "Starting…" : "Audio only"}
            </p>
          </div>
        )}

        {/* Soft scrim so blurred video still hides AI/Human cues; taps pass through to YT controls */}
        {isPlaying && (
          <div className="absolute inset-0 z-[1] bg-black/25 pointer-events-none" />
        )}
      </div>

      {!isPlaying ? (
        <button
          type="button"
          onClick={handleSyncAndPlay}
          className="w-full max-w-xs py-4 rounded-full font-bold text-base btn-primary touch-manipulation shadow-lg"
        >
          ▶ Sync & play ({syncReadyCount}/{syncTotalPlayers})
        </button>
      ) : (
        <p className="text-sm text-vinyl-accent font-medium">Now playing — listen & guess</p>
      )}

      <p className="text-xs text-gray-500 text-center max-w-xs">
        {isPlaying
          ? "No sound? Tap ▶ on the blurred video once."
          : "One tap syncs the room and starts the clip."}
      </p>
    </div>
  );
}
