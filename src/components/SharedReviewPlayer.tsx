"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { ReviewPlayback } from "@/types/game";
import { youtubeWatchUrl } from "@/lib/isThisAiSongs";
import { startYoutubeInGesture, stopYoutubeIframe } from "@/lib/youtubeEmbed";
import { useServerClockAnchor } from "@/hooks/useServerClockAnchor";
import { msUntilServerTime } from "@/lib/serverClock";

interface SharedReviewPlayerProps {
  playback: ReviewPlayback | null | undefined;
  isHost: boolean;
  onStop?: () => void;
  /** Only on final game-over / cover browser — not between rounds. */
  showYouTubeLink?: boolean;
}

/**
 * Host queues a clip; every device (including host) must tap Play when the
 * shared countdown hits 0. Phones block sound without a local tap — this is
 * the only way to keep the group roughly in sync.
 */
export default function SharedReviewPlayer({
  playback,
  isHost,
  onStop,
  showYouTubeLink = false,
}: SharedReviewPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [playUnlocked, setPlayUnlocked] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const clockAnchor = useServerClockAnchor(playback?.audioPlayAt ?? 0);

  useEffect(() => {
    setPlaying(false);
    setPlayUnlocked(false);
    setCountdown(0);
    stopYoutubeIframe(iframeRef.current);
  }, [playback?.youtubeVideoId, playback?.nonce]);

  useEffect(() => {
    return () => stopYoutubeIframe(iframeRef.current);
  }, []);

  useEffect(() => {
    if (!playback?.audioPlayAt || playing) return;

    const tick = () => {
      const msLeft = clockAnchor
        ? msUntilServerTime(clockAnchor, playback.audioPlayAt)
        : Math.max(0, playback.audioPlayAt - Date.now());
      setCountdown(Math.ceil(msLeft / 1000));
      if (msLeft <= 0) setPlayUnlocked(true);
    };

    tick();
    const id = window.setInterval(tick, 100);
    return () => clearInterval(id);
  }, [playback?.audioPlayAt, playback?.nonce, clockAnchor, playing]);

  const handlePlay = useCallback(() => {
    if (!playback || !playUnlocked || playing) return;
    const ok = startYoutubeInGesture(iframeRef.current, playback.youtubeVideoId, {
      startSec: playback.snippetStart,
      durationSec: playback.snippetDuration,
      mute: false,
      autoplay: true,
      controls: true,
    });
    if (!ok) return;
    setPlaying(true);
  }, [playback, playUnlocked, playing]);

  const handleStop = useCallback(() => {
    stopYoutubeIframe(iframeRef.current);
    setPlaying(false);
    onStop?.();
  }, [onStop]);

  if (!playback) return null;

  const thumb =
    playback.artworkUrl ||
    `https://img.youtube.com/vi/${playback.youtubeVideoId}/hqdefault.jpg`;

  return (
    <section className="w-full glass rounded-2xl overflow-hidden border border-vinyl-accent/30">
      <div className="flex gap-3 p-3 items-center">
        <div className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-black">
          <Image src={thumb} alt={playback.title} fill className="object-cover" unoptimized />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wide text-vinyl-accent">
            {playing ? "Playing for the group" : "Host queued a clip"}
          </p>
          <p className="font-medium text-sm truncate">{playback.title}</p>
          <p className="text-xs text-gray-400 truncate">
            {playback.aiLabel ? `${playback.aiLabel} · ` : ""}
            {playback.artist}
          </p>
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          {playing && isHost && (
            <button
              type="button"
              className="text-xs px-2.5 py-1 rounded-full bg-vinyl-accent/20 text-vinyl-accent font-semibold touch-manipulation"
              onClick={handleStop}
            >
              Stop for all
            </button>
          )}
          {showYouTubeLink && (
            <a
              href={youtubeWatchUrl(playback.youtubeVideoId)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-center text-gray-400 hover:text-white"
            >
              YouTube
            </a>
          )}
        </div>
      </div>

      <div className="relative w-full aspect-video bg-black">
        <iframe
          ref={iframeRef}
          title={playback.title}
          className={`absolute inset-0 w-full h-full border-0 pointer-events-none ${
            playing ? "opacity-100" : "opacity-0"
          }`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
        {!playing && (
          <button
            type="button"
            disabled={!playUnlocked}
            onClick={handlePlay}
            className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 touch-manipulation ${
              playUnlocked ? "bg-black/70" : "bg-black/80"
            }`}
          >
            {playUnlocked ? (
              <>
                <span className="px-5 py-3 rounded-full bg-vinyl-accent text-black font-bold text-base animate-pulse">
                  ▶ Play with the group
                </span>
                <span className="text-xs text-white/80 px-4 text-center">
                  Everyone taps now — phones need this for sound
                </span>
              </>
            ) : (
              <>
                <span className="text-4xl font-mono font-bold text-vinyl-accent">
                  {Math.max(1, countdown)}
                </span>
                <span className="text-sm text-white/80">Get ready — Play unlocks together</span>
              </>
            )}
          </button>
        )}
      </div>
    </section>
  );
}
