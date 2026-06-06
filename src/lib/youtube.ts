import ytdl from "@distube/ytdl-core";
import ytSearch from "yt-search";
import { Readable, PassThrough } from "stream";
import { YOUTUBE_FALLBACK } from "./fallbackTracks";
import { getJayChouSongList } from "./jayChouSongs";
import type { TrackInfo } from "@/types/game";

/** Fixed intro window: 0:01 → 0:03 (2 seconds) */
export const SNIPPET_START_SEC = 1;
export const SNIPPET_END_SEC = 3;
export const SNIPPET_DURATION_SEC = SNIPPET_END_SEC - SNIPPET_START_SEC;

const videoIdCache = new Map<string, string>();

export function getJayChouTracks(): TrackInfo[] {
  return getJayChouSongList().map((s) => ({
    id: s.id,
    name: s.name,
    youtubeVideoId: videoIdCache.get(s.name) ?? null,
  }));
}

export async function searchYouTubeVideo(songName: string): Promise<string | null> {
  const cached = videoIdCache.get(songName);
  if (cached) return cached;

  const fallback = YOUTUBE_FALLBACK[songName] ??
    Object.entries(YOUTUBE_FALLBACK).find(
      ([k]) => k.toLowerCase() === songName.toLowerCase()
    )?.[1];
  if (fallback) {
    videoIdCache.set(songName, fallback);
    return fallback;
  }

  try {
    const query = `${songName} Jay Chou`;
    const results = await ytSearch(query);
    const top = results.videos.find((v) => v.videoId && v.seconds > 30);
    if (!top?.videoId) return null;

    videoIdCache.set(songName, top.videoId);
    return top.videoId;
  } catch (err) {
    console.error(`YouTube search failed for "${songName}":`, err);
    return null;
  }
}

export function buildSnippetAudioUrl(videoId: string): string {
  return `/api/audio/snippet?videoId=${encodeURIComponent(videoId)}`;
}

export async function resolveTrackVideoId(songName: string): Promise<string | null> {
  return searchYouTubeVideo(songName);
}

export function pickRandomTrack(tracks: TrackInfo[], excludeIds: string[] = []): TrackInfo {
  const pool = tracks.filter((t) => !excludeIds.includes(t.id));
  if (pool.length === 0) {
    throw new Error("No tracks available");
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

export function buildChoices(correctTrack: TrackInfo, allTracks: TrackInfo[]): string[] {
  const decoys = allTracks
    .filter((t) => t.id !== correctTrack.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 5)
    .map((t) => t.name);

  return [correctTrack.name, ...decoys].sort(() => Math.random() - 0.5);
}

export async function pickTrackWithVideo(
  tracks: TrackInfo[],
  excludeIds: string[] = [],
  maxAttempts = 5
): Promise<{ track: TrackInfo; videoId: string } | null> {
  const tried = new Set<string>();

  for (let i = 0; i < maxAttempts; i++) {
    const pool = tracks.filter((t) => !excludeIds.includes(t.id) && !tried.has(t.id));
    if (pool.length === 0) break;

    const track = pickRandomTrack(pool);
    tried.add(track.id);

    const videoId =
      track.youtubeVideoId ?? (await resolveTrackVideoId(track.name));
    if (videoId) {
      track.youtubeVideoId = videoId;
      return { track, videoId };
    }
  }

  return null;
}

export function createSnippetStream(videoId: string): Readable {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const source = ytdl(url, {
    quality: "lowestaudio",
    filter: "audioonly",
    begin: `${SNIPPET_START_SEC}s`,
    highWaterMark: 1 << 25,
  });

  const output = new PassThrough();
  const maxMs = SNIPPET_DURATION_SEC * 1000;
  const startedAt = Date.now();

  source.on("data", (chunk: Buffer) => {
    if (Date.now() - startedAt >= maxMs) {
      source.destroy();
      output.end();
      return;
    }
    output.write(chunk);
  });

  source.on("end", () => output.end());
  source.on("error", (err) => {
    if (!output.destroyed) output.destroy(err);
  });

  return output;
}

export function nodeStreamToWebStream(nodeStream: Readable): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      nodeStream.on("data", (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
      nodeStream.on("end", () => controller.close());
      nodeStream.on("error", (err) => controller.error(err));
    },
    cancel() {
      nodeStream.destroy();
    },
  });
}
