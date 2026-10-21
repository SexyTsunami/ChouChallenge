"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  bindYoutubeListening,
  isLikelyMobile,
  postYoutubeCommand,
  youtubeEmbedUrl,
  youtubePause,
  youtubeSeekAndPlay,
  youtubeUnmuteAndPlay,
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
 * Plays a YouTube clip as audio-only during guessing.
 *
 * Mobile (esp. iOS) blocks unmuted autoplay unless playback starts in a tap.
 * Flow: sync tap mounts a muted autoplay iframe → at play time unmute →
 * if still silent, show "Tap for sound".
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
  const [hasSynced, setHasSynced] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [embedSrc, setEmbedSrc] = useState<string | null>(null);
  const [needsSoundTap, setNeedsSoundTap] = useState(false);
  const clockAnchor = useServerClockAnchor(roundStartTime);

  const signalSynced = useCallback(() => {
    if (readySignaledRef.current) return;
    readySignaledRef.current = true;

    // Must set iframe src inside the user gesture for muted mobile autoplay.
    setEmbedSrc(
      youtubeEmbedUrl(youtubeVideoId, {
        startSec: snippetStart,
        durationSec: snippetDuration + 120,
        mute: true,
        autoplay: true,
      })
    );
    setHasSynced(true);
    setNeedsSoundTap(false);
    onAudioReady?.();
  }, [onAudioReady, youtubeVideoId, snippetStart, snippetDuration]);

  useEffect(() => {
    readySignaledRef.current = false;
    setHasSynced(false);
    setIsPlaying(false);
    setEmbedSrc(null);
    setNeedsSoundTap(false);
  }, [youtubeVideoId]);

  // Pause muted priming once the iframe is ready so it doesn't drift.
  useEffect(() => {
    if (!embedSrc || isPlaying) return;
    const iframe = iframeRef.current;
    if (!iframe) return;

    const onLoad = () => {
      bindYoutubeListening(iframe);
      // Brief muted play unlocks iOS; then pause until the synced start.
      window.setTimeout(() => {
        youtubePause(iframe);
        postYoutubeCommand(iframe, "seekTo", [snippetStart, true]);
      }, 400);
    };

    iframe.addEventListener("load", onLoad);
    return () => iframe.removeEventListener("load", onLoad);
  }, [embedSrc, isPlaying, snippetStart]);

  useEffect(() => {
    if (!hasSynced || audioPlayAt <= 0 || !embedSrc) return;

    const delay = clockAnchor
      ? msUntilServerTime(clockAnchor, audioPlayAt)
      : Math.max(0, audioPlayAt - Date.now());

    const startTimeout = setTimeout(() => {
      const iframe = iframeRef.current;
      youtubeSeekAndPlay(iframe, snippetStart);
      setIsPlaying(true);
      // Desktop often unmutes fine; mobile usually still needs a tap.
      if (isLikelyMobile()) {
        setNeedsSoundTap(true);
      }
    }, delay);

    const stopTimeout = setTimeout(
      () => {
        youtubePause(iframeRef.current);
        setIsPlaying(false);
        setNeedsSoundTap(false);
        setEmbedSrc(null);
      },
      delay + snippetDuration * 1000 + 400
    );

    return () => {
      clearTimeout(startTimeout);
      clearTimeout(stopTimeout);
    };
  }, [
    hasSynced,
    audioPlayAt,
    clockAnchor,
    embedSrc,
    youtubeVideoId,
    snippetStart,
    snippetDuration,
  ]);

  const handleSoundTap = useCallback(() => {
    youtubeUnmuteAndPlay(iframeRef.current);
    postYoutubeCommand(iframeRef.current, "seekTo", [snippetStart, true]);
    setNeedsSoundTap(false);
    setIsPlaying(true);
  }, [snippetStart]);

  const showTapPrompt = !hasSynced;
  const showWaiting = hasSynced && audioSyncing;

  const statusText = showTapPrompt
    ? `Tap to sync (${syncReadyCount}/${syncTotalPlayers})`
    : showWaiting
      ? `Waiting for players… (${syncReadyCount}/${syncTotalPlayers})`
      : needsSoundTap
        ? "Tap for sound"
        : isPlaying
          ? "Now Playing"
          : "Listen closely…";

  const playerContent = (
    <>
      <div className="relative w-full max-w-xs aspect-video rounded-2xl overflow-hidden bg-vinyl-surface ring-1 ring-vinyl-border">
        {embedSrc && (
          <iframe
            ref={iframeRef}
            key={embedSrc}
            src={embedSrc}
            title="YouTube audio clip"
            // Keep "visible" for mobile media policies; cover hides the picture.
            className="absolute inset-0 w-full h-full opacity-[0.02]"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        )}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-vinyl-surface">
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl glass">
            <div className="relative flex-shrink-0">
              <div
                className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                  isPlaying && !needsSoundTap
                    ? "bg-vinyl-accent"
                    : showTapPrompt || showWaiting || needsSoundTap
                      ? "bg-amber-400"
                      : "bg-gray-600"
                }`}
              />
              {isPlaying && !needsSoundTap && (
                <span className="absolute inset-0 rounded-full bg-vinyl-accent animate-ping opacity-60" />
              )}
              {(showTapPrompt || showWaiting || needsSoundTap) && (
                <span className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-40" />
              )}
            </div>

            <div className="flex items-end gap-[3px] h-6 overflow-hidden">
              {EQ_ANIMATIONS.map((anim, i) => (
                <div
                  key={i}
                  className={`w-1.5 rounded-sm origin-bottom transition-colors duration-300 ${
                    isPlaying && !needsSoundTap
                      ? `bg-vinyl-accent ${anim}`
                      : showTapPrompt || showWaiting || needsSoundTap
                        ? "bg-amber-400/70"
                        : "bg-gray-600"
                  }`}
                  style={{
                    height:
                      isPlaying && !needsSoundTap
                        ? "24px"
                        : showTapPrompt || showWaiting || needsSoundTap
                          ? "12px"
                          : "3px",
                  }}
                />
              ))}
            </div>

            <span
              className={`text-xs font-medium tracking-wide transition-colors duration-300 ${
                isPlaying && !needsSoundTap
                  ? "text-vinyl-accent"
                  : showTapPrompt || showWaiting || needsSoundTap
                    ? "text-amber-400"
                    : "text-gray-500"
              }`}
            >
              {statusText}
            </span>
          </div>
          <p className="text-[11px] text-gray-500">Audio only</p>
        </div>
      </div>

      <p className="text-xs text-gray-500 text-center max-w-xs">
        {showTapPrompt
          ? "Everyone taps — enables sound, then the ~30s clip starts together."
          : showWaiting
            ? "Almost there — clip starts in a moment"
            : needsSoundTap
              ? "Mobile needs one more tap to unmute the clip."
              : "Video reveals after everyone guesses."}
      </p>
    </>
  );

  return (
    <div className="flex flex-col items-center gap-3">
      {showTapPrompt ? (
        <button
          type="button"
          onClick={signalSynced}
          className="flex flex-col items-center gap-3 w-full touch-manipulation active:opacity-90"
          aria-label="Tap to sync clip with group"
        >
          {playerContent}
        </button>
      ) : needsSoundTap ? (
        <button
          type="button"
          onClick={handleSoundTap}
          className="flex flex-col items-center gap-3 w-full touch-manipulation active:opacity-90"
          aria-label="Tap for sound"
        >
          {playerContent}
          <span className="w-full max-w-xs py-3 rounded-full font-semibold btn-primary">
            Tap for sound
          </span>
        </button>
      ) : (
        playerContent
      )}
    </div>
  );
}
