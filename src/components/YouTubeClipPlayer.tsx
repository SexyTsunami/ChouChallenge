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
 * Say “wider / taller / smaller” and we’ll nudge these.
 * YouTube’s big ▶ sits in the middle; bottom controls & corner logos stay blocked.
 */
const HIT_ZONE_WIDTH_PCT = 40;
const HIT_ZONE_HEIGHT_PCT = 46;

/** After this, seal the hole so spam taps can’t hit pause / other chrome. */
const SEAL_AFTER_MS = 4500;

function shieldClipPath(sealed: boolean): string {
  if (sealed) {
    // Full cover — no hole.
    return "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)";
  }
  const w = HIT_ZONE_WIDTH_PCT;
  const h = HIT_ZONE_HEIGHT_PCT;
  const left = (100 - w) / 2;
  const right = left + w;
  const top = (100 - h) / 2;
  const bottom = top + h;
  // evenodd: outer rect minus inner rect → hole passes taps to the iframe.
  return `polygon(evenodd, 0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${left}% ${top}%, ${right}% ${top}%, ${right}% ${bottom}%, ${left}% ${bottom}%, ${left}% ${top}%)`;
}

/**
 * Tap to Sync starts the clip. Then a shield blocks YouTube chrome everywhere
 * except a center hole over ▶ / “Tap to Play”.
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
  const sealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [shieldSealed, setShieldSealed] = useState(false);

  const clearStopTimer = () => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
  };

  const clearSealTimer = () => {
    if (sealTimerRef.current) {
      clearTimeout(sealTimerRef.current);
      sealTimerRef.current = null;
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
    setShieldSealed(false);
    onClipStarted?.();

    clearStopTimer();
    stopTimerRef.current = setTimeout(() => {
      stopYoutubeIframe(iframeRef.current);
    }, snippetDuration * 1000 + 800);

    // Leave the center hole open long enough for a play tap, then seal it.
    clearSealTimer();
    sealTimerRef.current = setTimeout(() => {
      setShieldSealed(true);
    }, SEAL_AFTER_MS);
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
    setShieldSealed(false);
    clearStopTimer();
    clearSealTimer();
    stopYoutubeIframe(iframeRef.current);
  }, [youtubeVideoId]);

  useEffect(() => {
    return () => {
      clearStopTimer();
      clearSealTimer();
      stopYoutubeIframe(iframeRef.current);
    };
  }, []);

  const hitLeft = (100 - HIT_ZONE_WIDTH_PCT) / 2;
  const hitTop = (100 - HIT_ZONE_HEIGHT_PCT) / 2;

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
            {/* Blocks logo / title / progress / links; hole over center ▶ */}
            <div
              className="absolute inset-0 z-10"
              style={{
                pointerEvents: "auto",
                clipPath: shieldClipPath(shieldSealed),
              }}
              aria-hidden
            />

            {/* Tuning outline — remove once size feels right */}
            {!shieldSealed && (
              <div
                className="absolute z-[11] pointer-events-none rounded-lg border border-dashed"
                style={{
                  left: `${hitLeft}%`,
                  top: `${hitTop}%`,
                  width: `${HIT_ZONE_WIDTH_PCT}%`,
                  height: `${HIT_ZONE_HEIGHT_PCT}%`,
                  borderColor: "rgba(110, 231, 183, 0.55)",
                }}
                aria-hidden
              />
            )}

            <p
              className="absolute inset-0 z-[12] flex items-center justify-center text-center text-lg font-bold pointer-events-none drop-shadow"
              style={{ color: "#6ee7b7" }}
            >
              {shieldSealed ? "Playing" : "Tap to Play"}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
