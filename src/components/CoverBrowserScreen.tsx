"use client";

import type { ClientRoomView, ReviewPlayback } from "@/types/game";
import { AI_CLIP_DURATION_SEC } from "@/types/game";
import { IS_THIS_AI_CLIPS, type AiClipTrack } from "@/lib/isThisAiSongs";
import SharedReviewPlayer from "./SharedReviewPlayer";
import YouTubeClipReplay from "./YouTubeClipReplay";

interface CoverBrowserScreenProps {
  room: ClientRoomView;
  isHost: boolean;
  onPlayClip: (clip: {
    youtubeVideoId: string;
    title: string;
    artist: string;
    aiLabel?: "AI" | "Human";
    artworkUrl?: string;
    snippetStart?: number;
    snippetDuration?: number;
  }) => void;
  onStopClip: () => void;
  onClose: () => void;
}

function ClipRow({
  clip,
  playback,
  isHost,
  onPlayClip,
  onStopClip,
}: {
  clip: AiClipTrack;
  playback: ReviewPlayback | null | undefined;
  isHost: boolean;
  onPlayClip: CoverBrowserScreenProps["onPlayClip"];
  onStopClip: () => void;
}) {
  const active = playback?.youtubeVideoId === clip.youtubeVideoId;
  return (
    <YouTubeClipReplay
      youtubeVideoId={clip.youtubeVideoId}
      title={clip.name}
      artist={clip.english}
      aiLabel={clip.aiLabel}
      artworkUrl={clip.artworkUrl}
      snippetStart={clip.snippetStart ?? 0}
      snippetDuration={AI_CLIP_DURATION_SEC}
      hostControlled
      isHost={isHost}
      isActive={active}
      onHostPlay={() =>
        onPlayClip({
          youtubeVideoId: clip.youtubeVideoId,
          title: clip.name,
          artist: clip.english,
          aiLabel: clip.aiLabel,
          artworkUrl: clip.artworkUrl,
          snippetStart: clip.snippetStart ?? 0,
          snippetDuration: AI_CLIP_DURATION_SEC,
        })
      }
      onHostStop={onStopClip}
      compact
    />
  );
}

export default function CoverBrowserScreen({
  room,
  isHost,
  onPlayClip,
  onStopClip,
  onClose,
}: CoverBrowserScreenProps) {
  const playback = room.reviewPlayback;
  const aiClips = IS_THIS_AI_CLIPS.filter((c) => c.aiLabel === "AI");
  const humanClips = IS_THIS_AI_CLIPS.filter((c) => c.aiLabel === "Human");

  return (
    <main className="min-h-dvh px-4 py-6 max-w-lg mx-auto flex flex-col gap-5">
      <header className="text-center">
        <p className="text-vinyl-accent text-sm font-medium tracking-wide uppercase">
          Full cover list
        </p>
        <h1 className="font-display text-2xl font-bold mt-1">Is This AI?</h1>
        <p className="text-xs text-gray-500 mt-2">
          {isHost
            ? "Play ~30s clips for the group — everyone hears what you pick."
            : "Host is picking clips for the group to hear."}
        </p>
      </header>

      <div className="sticky top-2 z-20">
        <SharedReviewPlayer playback={playback} isHost={isHost} onStop={onStopClip} />
      </div>

      <section className="space-y-3">
        <h2 className="font-display font-semibold text-sm text-gray-400 uppercase tracking-wide">
          AI · {aiClips.length}
        </h2>
        {aiClips.map((clip) => (
          <ClipRow
            key={clip.id}
            clip={clip}
            playback={playback}
            isHost={isHost}
            onPlayClip={onPlayClip}
            onStopClip={onStopClip}
          />
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-display font-semibold text-sm text-gray-400 uppercase tracking-wide">
          Human · {humanClips.length}
        </h2>
        {humanClips.map((clip) => (
          <ClipRow
            key={clip.id}
            clip={clip}
            playback={playback}
            isHost={isHost}
            onPlayClip={onPlayClip}
            onStopClip={onStopClip}
          />
        ))}
      </section>

      {isHost ? (
        <button type="button" className="btn-primary w-full sticky bottom-4" onClick={onClose}>
          Back to results
        </button>
      ) : (
        <p className="text-center text-gray-400 text-sm animate-pulse pb-4">
          Waiting for host to go back…
        </p>
      )}
    </main>
  );
}
