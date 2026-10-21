"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { startYoutubeInGesture, stopYoutubeIframe } from "@/lib/youtubeEmbed";
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
 * Mobile-first YouTube clip for guessing.
 * 1) Everyone taps Sync
 * 2) Shared countdown until audioPlayAt
 * 3) Everyone taps ▶ Play together (no desktop autoplay — keeps phones fair)
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
  const [playUnlocked, setPlayUnlocked] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const clockAnchor = useServerClockAnchor(audioPlayAt > 0 ? audioPlayAt : roundStartTime);

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
    setPlayUnlocked(false);
    setCountdown(0);
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

  // Shared countdown — Play unlocks on every device at the same server time.
  useEffect(() => {
    if (!hasSynced || audioPlayAt <= 0 || clipStarted) return;

    const tick = () => {
      const msLeft = clockAnchor
        ? msUntilServerTime(clockAnchor, audioPlayAt)
        : Math.max(0, audioPlayAt - Date.now());
      setCountdown(Math.ceil(msLeft / 1000));
      if (msLeft <= 0) setPlayUnlocked(true);
    };

    tick();
    const id = window.setInterval(tick, 100);
    return () => clearInterval(id);
  }, [hasSynced, audioPlayAt, clockAnchor, clipStarted]);

  const handlePlayClip = useCallback(() => {
    if (clipStarted || !playUnlocked) return;

    const ok = startYoutubeInGesture(iframeRef.current, youtubeVideoId, {
      startSec: snippetStart,
      durationSec: snippetDuration,
      mute: false,
      autoplay: true,
      controls: false,
    });
    if (!ok) return;

    setClipStarted(true);
    setIsPlaying(true);

    clearStopTimer();
    stopTimerRef.current = setTimeout(() => {
      setIsPlaying(false);
      stopYoutubeIframe(iframeRef.current);
    }, snippetDuration * 1000 + 500);
  }, [clipStarted, playUnlocked, youtubeVideoId, snippetStart, snippetDuration]);

  const showTapPrompt = !hasSynced;
  const showWaiting = hasSynced && audioSyncing;
  const showCountdown = hasSynced && !audioSyncing && !playUnlocked && !clipStarted;
  const showPlayPrompt = playUnlocked && !clipStarted;

  const statusText = showTapPrompt
    ? `Tap to sync (${syncReadyCount}/${syncTotalPlayers})`
    : showWaiting
      ? `Waiting for players… (${syncReadyCount}/${syncTotalPlayers})`
      : showCountdown
        ? `Play unlocks in ${Math.max(1, countdown)}…`
        : showPlayPrompt
          ? "▶ Tap Play together!"
          : isPlaying
            ? "Now Playing"
            : clipStarted
              ? "Clip finished"
              : "Listen closely…";

  const onPanelActivate = () => {
    if (showTapPrompt) signalSynced();
    else if (showPlayPrompt) handlePlayClip();
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="relative w-full max-w-xs aspect-video rounded-2xl overflow-hidden bg-black ring-1 ring-vinyl-border">
        <iframe
          ref={iframeRef}
          title="YouTube audio clip"
          tabIndex={-1}
          className={`absolute inset-0 w-full h-full border-0 pointer-events-none ${
            isPlaying ? "opacity-100" : "opacity-0"
          }`}
          style={
            isPlaying
              ? { filter: "blur(32px) brightness(0.4) saturate(0.5)" }
              : undefined
          }
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
        />

        <button
          type="button"
          disabled={!showTapPrompt && !showPlayPrompt}
          onClick={onPanelActivate}
          className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 touch-manipulation ${
            isPlaying ? "bg-black/50" : "bg-vinyl-surface"
          } ${showTapPrompt || showPlayPrompt ? "cursor-pointer" : "cursor-default"}`}
          aria-label={
            showTapPrompt ? "Tap to sync" : showPlayPrompt ? "Play clip" : "Now playing"
          }
        >
          {showCountdown && (
            <span className="text-5xl font-mono font-bold text-vinyl-accent">
              {Math.max(1, countdown)}
            </span>
          )}
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl glass pointer-events-none">
            <div className="relative flex-shrink-0">
              <div
                className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                  isPlaying
                    ? "bg-vinyl-accent"
                    : showTapPrompt || showWaiting || showCountdown || showPlayPrompt
                      ? "bg-amber-400"
                      : "bg-gray-600"
                }`}
              />
              {isPlaying && (
                <span className="absolute inset-0 rounded-full bg-vinyl-accent animate-ping opacity-60" />
              )}
              {(showTapPrompt || showWaiting || showCountdown || showPlayPrompt) &&
                !isPlaying && (
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
                      : showTapPrompt || showWaiting || showCountdown || showPlayPrompt
                        ? "bg-amber-400/70"
                        : "bg-gray-600"
                  }`}
                  style={{
                    height: isPlaying
                      ? "24px"
                      : showTapPrompt || showWaiting || showCountdown || showPlayPrompt
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
                  : showTapPrompt || showWaiting || showCountdown || showPlayPrompt
                    ? "text-amber-400"
                    : "text-gray-500"
              }`}
            >
              {statusText}
            </span>
          </div>
          <p className="text-[11px] text-white/70 pointer-events-none">
            {isPlaying
              ? "Listening… (video hidden)"
              : showPlayPrompt
                ? "Everyone tap Play now"
                : showCountdown
                  ? "Get ready — same moment for all devices"
                  : "Audio only"}
          </p>
        </button>
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
          className="w-full max-w-xs py-4 rounded-full font-bold text-base btn-primary touch-manipulation shadow-lg animate-pulse"
        >
          ▶ Play clip together
        </button>
      )}

      <p className="text-xs text-gray-500 text-center max-w-xs">
        {showTapPrompt
          ? "Everyone taps to sync first."
          : showWaiting
            ? "Waiting for the rest of the group…"
            : showCountdown
              ? "Play unlocks at the same time on every phone & desktop."
              : showPlayPrompt
                ? "Tap ▶ together — required for fair sound on phones."
                : "Guess AI or Human — video reveals after the round."}
      </p>
    </div>
  );
}
