"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { ReviewPlayback } from "@/types/game";
import { youtubeWatchUrl } from "@/lib/isThisAiSongs";
import { startYoutubeInGesture, stopYoutubeIframe } from "@/lib/youtubeEmbed";

interface SharedReviewPlayerProps {
  playback: ReviewPlayback | null | undefined;
  isHost: boolean;
  onStop?: () => void;
  showYouTubeLink?: boolean;
}

/**
 * Host queues a clip → every device taps ▶ Play for sound.
 * No hidden iframe (iOS blocks audio). Controls stay on as unmute fallback.
 */
export default function SharedReviewPlayer({
  playback,
  isHost,
  onStop,
  showYouTubeLink = false,
}: SharedReviewPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setPlaying(false);
    stopYoutubeIframe(iframeRef.current);
  }, [playback?.youtubeVideoId, playback?.nonce]);

  useEffect(() => {
    return () => stopYoutubeIframe(iframeRef.current);
  }, []);

  const handlePlay = useCallback(() => {
    if (!playback || playing) return;
    const iframe = iframeRef.current;
    if (!iframe) return;

    iframe.style.opacity = "1";
    const ok = startYoutubeInGesture(iframe, playback.youtubeVideoId, {
      startSec: playback.snippetStart,
      durationSec: playback.snippetDuration,
      mute: false,
      autoplay: true,
      controls: true,
    });
    if (!ok) return;
    setPlaying(true);
  }, [playback, playing]);

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
            {playing ? "Playing" : "Clip ready"}
          </p>
          <p className="font-medium text-sm truncate">{playback.title}</p>
          <p className="text-xs text-gray-400 truncate">
            {playback.aiLabel ? `${playback.aiLabel} · ` : ""}
            {playback.artist}
          </p>
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          {!playing ? (
            <button
              type="button"
              className="text-xs px-3 py-1.5 rounded-full bg-vinyl-accent text-black font-bold touch-manipulation"
              onClick={handlePlay}
            >
              ▶ Play
            </button>
          ) : isHost ? (
            <button
              type="button"
              className="text-xs px-2.5 py-1 rounded-full bg-vinyl-accent/20 text-vinyl-accent font-semibold touch-manipulation"
              onClick={handleStop}
            >
              Stop
            </button>
          ) : null}
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
          className="absolute inset-0 w-full h-full border-0"
          style={{ opacity: playing ? 1 : 0 }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
        {!playing && (
          <button
            type="button"
            onClick={handlePlay}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/75 touch-manipulation"
          >
            <span className="px-5 py-3 rounded-full bg-vinyl-accent text-black font-bold text-base">
              ▶ Play clip
            </span>
            <span className="text-xs text-white/80 px-4 text-center">
              Tap for sound — required on phones
            </span>
          </button>
        )}
      </div>
    </section>
  );
}
