import type { SongChoice, TrackInfo } from "@/types/game";
import { getJayChouSongList } from "./jayChouSongs";

const ITUNES_API = "https://itunes.apple.com/search";

interface ItunesResult {
  trackName?: string;
  collectionName?: string;
  previewUrl?: string;
  artworkUrl100?: string;
}

// Live / world-tour recordings have crowd noise and are harder to recognize.
const LIVE_PATTERNS = [
  /world tour/i,
  /\blive\b/i,
  /concert/i,
  /演唱會/,
  /演唱会/,
  /巡迴/,
  /巡回/,
  /现场/,
  /現場/,
];

function isLiveRecording(result: ItunesResult): boolean {
  const text = `${result.trackName ?? ""} ${result.collectionName ?? ""}`;
  return LIVE_PATTERNS.some((re) => re.test(text));
}

interface ItunesResponse {
  resultCount: number;
  results: ItunesResult[];
}

const previewCache = new Map<string, { previewUrl: string; artworkUrl: string }>();

export const SNIPPET_DURATION_SEC = 3;

export function getJayChouTracks(): TrackInfo[] {
  return getJayChouSongList();
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildChoices(
  correct: TrackInfo,
  tracks: TrackInfo[],
  count = 4
): { choices: SongChoice[]; correctIndex: number } {
  const distractors = shuffle(tracks.filter((t) => t.id !== correct.id)).slice(0, count - 1);
  const ordered = shuffle([correct, ...distractors]);
  const choices = ordered.map((t) => ({ name: t.name, english: t.english }));
  const correctIndex = ordered.findIndex((t) => t.id === correct.id);
  return { choices, correctIndex };
}

export function randomSnippetParams(): { snippetStart: number; snippetDuration: number } {
  // iTunes previews are ~30s; pick a start within the first ~18s.
  const snippetStart = Math.random() * 18;
  const snippetDuration = 1 + Math.random() * 2; // 1-3s
  return { snippetStart, snippetDuration };
}

export async function fetchItunesPreview(
  track: TrackInfo
): Promise<{ previewUrl: string; artworkUrl: string } | null> {
  const cached = previewCache.get(track.id);
  if (cached) return cached;

  try {
    const term = encodeURIComponent(`Jay Chou ${track.name}`);
    const url = `${ITUNES_API}?term=${term}&media=music&entity=song&limit=5&country=US`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = (await res.json()) as ItunesResponse;
    // Prefer studio versions; skip the track entirely if only live recordings exist.
    const hit = data.results?.find((r) => r.previewUrl && !isLiveRecording(r));
    if (!hit?.previewUrl) return null;

    const artworkUrl = (hit.artworkUrl100 ?? "").replace("100x100bb", "600x600bb");
    const entry = { previewUrl: hit.previewUrl, artworkUrl };
    previewCache.set(track.id, entry);
    return entry;
  } catch (err) {
    console.error(`iTunes fetch failed for "${track.name}":`, err);
    return null;
  }
}

export async function pickTrackWithPreview(
  tracks: TrackInfo[],
  maxAttempts = 8
): Promise<{ track: TrackInfo; previewUrl: string; artworkUrl: string } | null> {
  const pool = shuffle(tracks).slice(0, maxAttempts);
  for (const track of pool) {
    const preview = await fetchItunesPreview(track);
    if (preview) return { track, ...preview };
  }
  return null;
}
