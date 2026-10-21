"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  isLikelyMobile,
  startYoutubeInGesture,
  stopYoutubeIframe,
} from "@/lib/youtubeEmbed";
import { useServerClockAnchor } from "@/hooks/useServerClockAnchor";
import { msUntilServerTime } from "@/lib/serverClock";

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

const EQ_ANIMATIONS = [
  "animate-eq-1",
  "animate-eq-2",
  "animate-eq-3",
  "animate-eq-4",
  "animate-eq-5",
];

/**
 * Audio-focused YouTube clip for guessing.
 * Iframe stays mounted; Play sets src inside the tap (required for mobile sound).
 * Video is heavily blurred so it doesn't spoil AI vs Human.
 */
export default function YouTubeClipPlayer({
  youtubeVideoId,
  snippetStart,
  snippetDuration,
  roundStartTime,
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
  const [awaitingPlayTap, setAwaitingPlayTap] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const clockAnchor = useServerClockAnchor(roundStartTime);

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
    setAwaitingPlayTap(false);
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

  useEffect(() => {
    if (!hasSynced || audioPlayAt <= 0 || clipStarted) return;

    const delay = clockAnchor
      ? msUntilServerTime(clockAnchor, audioPlayAt)
      : Math.max(0, audioPlayAt - Date.now());

    const startTimeout = setTimeout(() => {
      setAwaitingPlayTap(true);
    }, delay);

    return () => clearTimeout(startTimeout);
  }, [hasSynced, audioPlayAt, clockAnchor, clipStarted]);

  const handlePlayClip = useCallback(() => {
    if (clipStarted) return;

    const ok = startYoutubeInGesture(iframeRef.current, youtubeVideoId, {
      startSec: snippetStart,
      durationSec: snippetDuration,
      mute: false,
      autoplay: true,
      controls: false,
    });
    if (!ok) return;

    setClipStarted(true);
    setAwaitingPlayTap(false);
    setIsPlaying(true);

    clearStopTimer();
    stopTimerRef.current = setTimeout(() => {
      setIsPlaying(false);
      stopYoutubeIframe(iframeRef.current);
    }, snippetDuration * 1000 + 500);
  }, [clipStarted, youtubeVideoId, snippetStart, snippetDuration]);

  // Desktop: start when the group is ready (autoplay with sound usually works).
  useEffect(() => {
    if (!awaitingPlayTap || clipStarted || isLikelyMobile()) return;
    handlePlayClip();
  }, [awaitingPlayTap, clipStarted, handlePlayClip]);

  const showTapPrompt = !hasSynced;
  const showWaiting = hasSynced && audioSyncing;
  const showPlayPrompt = awaitingPlayTap && !clipStarted;

  const statusText = showTapPrompt
    ? `Tap to sync (${syncReadyCount}/${syncTotalPlayers})`
    : showWaiting
      ? `Waiting for players… (${syncReadyCount}/${syncTotalPlayers})`
      : showPlayPrompt
        ? "Ready — tap Play clip"
        : isPlaying
          ? "Now Playing"
          : clipStarted
            ? "Clip finished"
            : "Listen closely…";

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="relative w-full max-w-xs aspect-video rounded-2xl overflow-hidden bg-black ring-1 ring-vinyl-border">
        {/* Always mounted so Play can set src inside the user gesture */}
        <iframe
          ref={iframeRef}
          title="YouTube audio clip"
          className={`absolute inset-0 w-full h-full border-0 transition-opacity ${
            isPlaying ? "opacity-100" : "opacity-0"
          }`}
          style={
            isPlaying
              ? { filter: "blur(28px) brightness(0.45) saturate(0.6)" }
              : undefined
          }
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
        />

        <div
          className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 ${
            isPlaying ? "bg-black/45 pointer-events-none" : "bg-vinyl-surface"
          }`}
        >
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl glass">
            <div className="relative flex-shrink-0">
              <div
                className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                  isPlaying
                    ? "bg-vinyl-accent"
                    : showTapPrompt || showWaiting || showPlayPrompt
                      ? "bg-amber-400"
                      : "bg-gray-600"
                }`}
              />
              {isPlaying && (
                <span className="absolute inset-0 rounded-full bg-vinyl-accent animate-ping opacity-60" />
              )}
              {(showTapPrompt || showWaiting || showPlayPrompt) && !isPlaying && (
                <span className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-40" />
              )}
            </div>

            <div className="flex items-end gap-[3px] h-6 overflow-hidden">
              {EQ_ANIMATIONS.map((anim, i) => (
                <div
                  key={i}
                  className={`w-1.5 rounded-sm origin-bottom transition-colors duration-300 ${
                    isPlaying
                      ? `bg-vinyl-accent ${anim}`
                      : showTapPrompt || showWaiting || showPlayPrompt
                        ? "bg-amber-400/70"
                        : "bg-gray-600"
                  }`}
                  style={{
                    height: isPlaying
                      ? "24px"
                      : showTapPrompt || showWaiting || showPlayPrompt
                        ? "12px"
                        : "3px",
                  }}
                />
              ))}
            </div>

            <span
              className={`text-xs font-medium tracking-wide transition-colors duration-300 ${
                isPlaying
                  ? "text-vinyl-accent"
                  : showTapPrompt || showWaiting || showPlayPrompt
                    ? "text-amber-400"
                    : "text-gray-500"
              }`}
            >
              {statusText}
            </span>
          </div>
          <p className="text-[11px] text-white/70">
            {isPlaying ? "Listening…" : "Audio only"}
          </p>
        </div>
      </div>

      {showTapPrompt && (
        <button
          type="button"
          onClick={signalSynced}
          className="w-full max-w-xs py-3 rounded-full font-semibold btn-primary touch-manipulation"
        >
          Tap to sync ({syncReadyCount}/{syncTotalPlayers})
        </button>
      )}

      {showPlayPrompt && (
        <button
          type="button"
          onClick={handlePlayClip}
          className="w-full max-w-xs py-3 rounded-full font-semibold btn-primary touch-manipulation"
        >
          Play clip
        </button>
      )}

      <p className="text-xs text-gray-500 text-center max-w-xs">
        {showTapPrompt
          ? "Everyone taps to sync first."
          : showWaiting
            ? "Almost there…"
            : showPlayPrompt
              ? "Phones need this Play tap for sound."
              : "Video reveals after everyone guesses."}
      </p>
    </div>
  );
}
