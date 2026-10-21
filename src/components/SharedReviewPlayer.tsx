"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import type { ReviewPlayback } from "@/types/game";
import { youtubeWatchUrl } from "@/lib/isThisAiSongs";
import { youtubeEmbedUrl } from "@/lib/youtubeEmbed";

interface SharedReviewPlayerProps {
  playback: ReviewPlayback | null | undefined;
  isHost: boolean;
  onStop?: () => void;
}

/** Single room-wide YouTube embed — requires Tap to play for mobile sound. */
export default function SharedReviewPlayer({
  playback,
  isHost,
  onStop,
}: SharedReviewPlayerProps) {
  const [embedSrc, setEmbedSrc] = useState<string | null>(null);

  useEffect(() => {
    setEmbedSrc(null);
  }, [playback?.youtubeVideoId, playback?.nonce]);

  const handlePlay = useCallback(() => {
    if (!playback) return;
    setEmbedSrc(
      youtubeEmbedUrl(playback.youtubeVideoId, {
        startSec: playback.snippetStart,
        durationSec: playback.snippetDuration,
        mute: false,
        autoplay: true,
      })
    );
  }, [playback]);

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
          <p className="text-[10px] uppercase tracking-wide text-vinyl-accent">Now playing</p>
          <p className="font-medium text-sm truncate">{playback.title}</p>
          <p className="text-xs text-gray-400 truncate">
            {playback.aiLabel ? `${playback.aiLabel} · ` : ""}
            {playback.artist}
          </p>
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          {!embedSrc ? (
            <button
              type="button"
              className="text-xs px-2.5 py-1 rounded-full bg-vinyl-accent text-black font-semibold"
              onClick={handlePlay}
            >
              Play
            </button>
          ) : isHost && onStop ? (
            <button
              type="button"
              className="text-xs px-2.5 py-1 rounded-full bg-vinyl-accent/20 text-vinyl-accent font-semibold"
              onClick={onStop}
            >
              Stop
            </button>
          ) : null}
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
      {embedSrc ? (
        <div className="relative w-full aspect-video bg-black">
          <iframe
            key={embedSrc}
            src={embedSrc}
            title={playback.title}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={handlePlay}
          className="w-full py-6 text-sm text-gray-400 hover:text-white bg-black/40 touch-manipulation"
        >
          Tap to play ~30s clip
        </button>
      )}
    </section>
  );
}
