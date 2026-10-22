"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { ReviewPlayback } from "@/types/game";
import { youtubeWatchUrl } from "@/lib/isThisAiSongs";
import { youtubeEmbedUrl, stopYoutubeIframe } from "@/lib/youtubeEmbed";

interface SharedReviewPlayerProps {
  playback: ReviewPlayback | null | undefined;
  isHost: boolean;
  onStop?: () => void;
  showYouTubeLink?: boolean;
}

/** Host queues a clip → tap ▶ Play (iframe created in the tap for mobile sound). */
export default function SharedReviewPlayer({
  playback,
  isHost,
  onStop,
  showYouTubeLink = false,
}: SharedReviewPlayerProps) {
  const frameHostRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [playing, setPlaying] = useState(false);

  const clearFrame = () => {
    if (iframeRef.current) {
      stopYoutubeIframe(iframeRef.current);
      iframeRef.current.remove();
      iframeRef.current = null;
    }
    if (frameHostRef.current) frameHostRef.current.innerHTML = "";
  };

  useEffect(() => {
    setPlaying(false);
    clearFrame();
  }, [playback?.youtubeVideoId, playback?.nonce]);

  useEffect(() => () => clearFrame(), []);

  const handlePlay = useCallback(() => {
    if (!playback || playing) return;
    const host = frameHostRef.current;
    if (!host) return;

    clearFrame();
    const iframe = document.createElement("iframe");
    iframe.title = playback.title;
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.setAttribute(
      "style",
      "position:absolute;inset:0;width:100%;height:100%;border:0;pointer-events:none"
    );
    iframe.src = youtubeEmbedUrl(playback.youtubeVideoId, {
      startSec: playback.snippetStart,
      durationSec: playback.snippetDuration,
      mute: false,
      autoplay: true,
      controls: false,
    });
    host.appendChild(iframe);
    iframeRef.current = iframe;
    setPlaying(true);
  }, [playback, playing]);

  const handleStop = useCallback(() => {
    clearFrame();
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
        <div ref={frameHostRef} className="absolute inset-0" />
        {!playing && (
          <button
            type="button"
            onClick={handlePlay}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/75 touch-manipulation"
          >
            <span className="px-5 py-3 rounded-full bg-vinyl-accent text-black font-bold text-base">
              ▶ Play clip
            </span>
            <span className="text-xs text-white/80">Tap once for sound</span>
          </button>
        )}
        {playing && (
          <div className="absolute inset-0 z-10 pointer-events-none bg-transparent" />
        )}
      </div>
    </section>
  );
}
