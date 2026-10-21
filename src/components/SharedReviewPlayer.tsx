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
}

/** Room-wide clip player — iframe stays mounted; Play sets src in the tap. */
export default function SharedReviewPlayer({
  playback,
  isHost,
  onStop,
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
    if (!playback) return;
    const ok = startYoutubeInGesture(iframeRef.current, playback.youtubeVideoId, {
      startSec: playback.snippetStart,
      durationSec: playback.snippetDuration,
      mute: false,
      autoplay: true,
      controls: true,
    });
    if (!ok) return;
    setPlaying(true);
  }, [playback]);

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
          <p className="text-[10px] uppercase tracking-wide text-vinyl-accent">Clip ready</p>
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
              className="text-xs px-2.5 py-1 rounded-full bg-vinyl-accent text-black font-semibold touch-manipulation"
              onClick={handlePlay}
            >
              Play
            </button>
          ) : (
            <button
              type="button"
              className="text-xs px-2.5 py-1 rounded-full bg-vinyl-accent/20 text-vinyl-accent font-semibold touch-manipulation"
              onClick={handleStop}
            >
              Stop
            </button>
          )}
          <a
            href={youtubeWatchUrl(playback.youtubeVideoId)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-center text-gray-400 hover:text-white"
          >
            YouTube
          </a>
        </div>
      </div>

      <div className="relative w-full aspect-video bg-black">
        <iframe
          ref={iframeRef}
          title={playback.title}
          className={`absolute inset-0 w-full h-full border-0 ${playing ? "opacity-100" : "opacity-0"}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
        {!playing && (
          <button
            type="button"
            onClick={handlePlay}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/70 touch-manipulation"
          >
            <span className="px-4 py-2 rounded-full bg-vinyl-accent text-black font-semibold text-sm">
              Tap to play ~30s clip
            </span>
            <span className="text-xs text-white/70">Required for sound on phones</span>
          </button>
        )}
      </div>
    </section>
  );
}
