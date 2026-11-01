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
 * First-guess center hit zone (% of the player box).
 * Say wider / narrower / taller / shorter to tune.
 * Edges block YouTube logo / scrubber / links; center reaches ▶.
 */
const HIT_ZONE_WIDTH_PCT = 40;
const HIT_ZONE_HEIGHT_PCT = 46;

/**
 * Tap to Sync starts the clip. Edge shields block YouTube chrome;
 * only the center hole forwards taps to the player (for ▶ if silent).
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
    setHasStarted(true);
    onClipStarted?.();

    clearStopTimer();
    stopTimerRef.current = setTimeout(() => {
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

  const sidePct = (100 - HIT_ZONE_WIDTH_PCT) / 2;
  const topPct = (100 - HIT_ZONE_HEIGHT_PCT) / 2;
  const bottomPct = topPct;

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
            pointerEvents: hasStarted ? "auto" : "none",
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
        />

        {!hasStarted ? (
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
            {/* Four edge blockers — center is empty so taps reach YouTube ▶ */}
            <div
              className="absolute left-0 right-0 top-0 z-10"
              style={{ height: `${topPct}%`, pointerEvents: "auto" }}
              aria-hidden
            />
            <div
              className="absolute left-0 right-0 bottom-0 z-10"
              style={{ height: `${bottomPct}%`, pointerEvents: "auto" }}
              aria-hidden
            />
            <div
              className="absolute left-0 z-10"
              style={{
                top: `${topPct}%`,
                bottom: `${bottomPct}%`,
                width: `${sidePct}%`,
                pointerEvents: "auto",
              }}
              aria-hidden
            />
            <div
              className="absolute right-0 z-10"
              style={{
                top: `${topPct}%`,
                bottom: `${bottomPct}%`,
                width: `${sidePct}%`,
                pointerEvents: "auto",
              }}
              aria-hidden
            />

            {/* Tuning outline — say bigger/smaller to adjust */}
            <div
              className="absolute z-[11] pointer-events-none rounded-lg border border-dashed"
              style={{
                left: `${sidePct}%`,
                top: `${topPct}%`,
                width: `${HIT_ZONE_WIDTH_PCT}%`,
                height: `${HIT_ZONE_HEIGHT_PCT}%`,
                borderColor: "rgba(110, 231, 183, 0.55)",
              }}
              aria-hidden
            />

            <p
              className="absolute inset-0 z-[12] flex items-center justify-center text-center text-lg font-bold pointer-events-none drop-shadow"
              style={{ color: "#6ee7b7" }}
            >
              Tap to Play
            </p>
          </>
        )}
      </div>
    </div>
  );
}
