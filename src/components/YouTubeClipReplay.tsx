"use client";

import Image from "next/image";
import { youtubeWatchUrl } from "@/lib/isThisAiSongs";

interface YouTubeClipReplayProps {
  youtubeVideoId: string;
  title: string;
  artist: string;
  aiLabel?: "AI" | "Human";
  artworkUrl?: string;
  snippetStart?: number;
  snippetDuration?: number;
  roundNumber?: number;
  compact?: boolean;
  hostControlled?: boolean;
  isHost?: boolean;
  isActive?: boolean;
  onHostPlay?: () => void;
  onHostStop?: () => void;
  /** Only after final score / cover browser. */
  showYouTubeLink?: boolean;
}

/**
 * Clip row with host queue controls. Actual playback is in SharedReviewPlayer
 * so every device taps Play on the shared countdown.
 */
export default function YouTubeClipReplay({
  youtubeVideoId,
  title,
  artist,
  aiLabel,
  artworkUrl,
  roundNumber,
  compact = false,
  hostControlled = false,
  isHost = false,
  isActive = false,
  onHostPlay,
  onHostStop,
  showYouTubeLink = false,
}: YouTubeClipReplayProps) {
  const watchUrl = youtubeWatchUrl(youtubeVideoId);
  const thumb = artworkUrl || `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`;

  const handlePlayToggle = () => {
    if (!hostControlled || !isHost) return;
    if (isActive) onHostStop?.();
    else onHostPlay?.();
  };

  return (
    <div
      className={`bg-vinyl-card rounded-xl overflow-hidden ${
        compact ? "" : "border border-vinyl-border"
      } ${isActive ? "ring-1 ring-vinyl-accent/50" : ""}`}
    >
      <div className="flex gap-3 p-3">
        <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-black">
          <Image src={thumb} alt={title} fill className="object-cover" unoptimized />
        </div>
        <div className="min-w-0 flex-1">
          {(roundNumber != null || aiLabel) && (
            <p className="text-[10px] uppercase tracking-wide text-gray-500">
              {roundNumber != null ? `Round ${roundNumber}` : null}
              {roundNumber != null && aiLabel ? " · " : null}
              {aiLabel ?? null}
            </p>
          )}
          <p className="font-medium text-sm truncate">{title}</p>
          <p className="text-xs text-gray-400 truncate">{artist}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {hostControlled ? (
              isHost ? (
                <button
                  type="button"
                  className="text-xs px-2.5 py-1 rounded-full bg-vinyl-accent/20 text-vinyl-accent font-semibold"
                  onClick={handlePlayToggle}
                >
                  {isActive ? "Stop for all" : "Play for group"}
                </button>
              ) : (
                <span
                  className={`text-xs px-2.5 py-1 rounded-full ${
                    isActive
                      ? "bg-vinyl-accent/20 text-vinyl-accent"
                      : "bg-vinyl-surface text-gray-500"
                  }`}
                >
                  {isActive ? "Queued — tap Play above" : "Host picks the clip"}
                </span>
              )
            ) : null}
            {showYouTubeLink && (
              <a
                href={watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-2.5 py-1 rounded-full bg-vinyl-surface text-gray-300 hover:text-white"
              >
                Open on YouTube
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
