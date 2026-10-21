"use client";

import type { PlayedClip, ReviewPlayback } from "@/types/game";
import SharedReviewPlayer from "./SharedReviewPlayer";
import YouTubeClipReplay from "./YouTubeClipReplay";

interface ClipReviewListProps {
  clips: PlayedClip[];
  playback: ReviewPlayback | null | undefined;
  isHost: boolean;
  onPlayClip: (clip: PlayedClip) => void;
  onStopClip: () => void;
  onOpenCoverBrowser?: () => void;
  heading?: string;
  /** When false, parent already renders SharedReviewPlayer. */
  showSharedPlayer?: boolean;
}

export default function ClipReviewList({
  clips,
  playback,
  isHost,
  onPlayClip,
  onStopClip,
  onOpenCoverBrowser,
  heading = "Clips this game (in order)",
  showSharedPlayer = true,
}: ClipReviewListProps) {
  return (
    <section className="w-full glass rounded-2xl p-4 space-y-3">
      {showSharedPlayer && (
        <SharedReviewPlayer playback={playback} isHost={isHost} onStop={onStopClip} />
      )}
      {clips.length > 0 && (
        <>
          <h2 className="font-display font-semibold text-sm text-gray-400 uppercase tracking-wide text-center">
            {heading}
          </h2>
          <p className="text-xs text-gray-500 text-center">
            {isHost
              ? "Only you can start clips — everyone in the room hears them."
              : "Host picks which clips to play for the group."}
          </p>
          {clips.map((clip) => {
            const active = playback?.youtubeVideoId === clip.youtubeVideoId;
            return (
              <YouTubeClipReplay
                key={`${clip.roundNumber}-${clip.youtubeVideoId}`}
                youtubeVideoId={clip.youtubeVideoId}
                title={clip.title}
                artist={clip.artist}
                aiLabel={clip.aiLabel}
                artworkUrl={clip.artworkUrl}
                snippetStart={clip.snippetStart}
                snippetDuration={clip.snippetDuration}
                roundNumber={clip.roundNumber}
                compact
                hostControlled
                isHost={isHost}
                isActive={active}
                onHostPlay={() => onPlayClip(clip)}
                onHostStop={onStopClip}
              />
            );
          })}
        </>
      )}
      {isHost && onOpenCoverBrowser && (
        <button
          type="button"
          className="w-full py-3 rounded-full font-semibold border border-vinyl-border bg-vinyl-surface hover:border-vinyl-accent/50 transition-colors"
          onClick={onOpenCoverBrowser}
        >
          See the full list of covers
        </button>
      )}
      {!isHost && onOpenCoverBrowser && (
        <p className="text-center text-[11px] text-gray-500 pt-1">
          Host can open the full cover list for everyone
        </p>
      )}
    </section>
  );
}
