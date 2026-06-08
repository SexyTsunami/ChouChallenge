import type { SongChoice, TrackInfo } from "@/types/game";
import { getJayChouSongList } from "./jayChouSongs";

const ITUNES_API = "https://itunes.apple.com/search";

interface ItunesResult {
  trackName?: string;
  artistName?: string;
  collectionName?: string;
  previewUrl?: string;
  artworkUrl100?: string;
}

interface ItunesResponse {
  resultCount: number;
  results: ItunesResult[];
}

interface CachedPreview {
  previewUrl: string;
  artworkUrl: string;
  itunesTrackName: string;
  itunesArtistName: string;
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

const MIN_MATCH_SCORE = 70;

// Cover / tribute / karaoke releases — not Jay Chou's own vocals.
const COVER_PATTERNS = [
  /\bcover\b/i,
  /\btribute\b/i,
  /\bkaraoke\b/i,
  /\binstrumental\b/i,
  /翻唱/,
  /伴奏/,
  /纯音乐/,
  /鋼琴版/,
  /钢琴版/,
  /演奏版/,
  /吉他版/,
];

const previewCache = new Map<string, CachedPreview>();

export const SNIPPET_DURATION_SEC = 3;

export function getJayChouTracks(): TrackInfo[] {
  return getJayChouSongList();
}

function isLiveRecording(result: ItunesResult): boolean {
  const text = `${result.trackName ?? ""} ${result.collectionName ?? ""}`;
  return LIVE_PATTERNS.some((re) => re.test(text));
}

function isCoverOrTribute(result: ItunesResult): boolean {
  const text = `${result.artistName ?? ""} ${result.trackName ?? ""} ${result.collectionName ?? ""}`;
  return COVER_PATTERNS.some((re) => re.test(text));
}

/** Only accept previews credited to Jay Chou / 周杰伦 (not cover artists). */
function isJayChouArtist(artistName: string): boolean {
  const name = artistName.trim();
  if (!name) return false;
  if (/jay chou/i.test(name)) return true;
  if (/周杰倫|周杰伦/.test(name)) return true;
  return false;
}

function isJayChouRecording(result: ItunesResult): boolean {
  if (isCoverOrTribute(result)) return false;
  return isJayChouArtist(result.artistName ?? "");
}

function normalizeEnglish(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

/** Score how well an iTunes result matches a specific catalog track (0–100). */
function scoreItunesMatch(result: ItunesResult, track: TrackInfo): number {
  const trackName = (result.trackName ?? "").trim();
  if (!trackName) return 0;

  if (trackName === track.name) return 100;
  if (trackName.includes(track.name)) return 90;

  const normalizedResult = normalizeEnglish(trackName);
  const normalizedEnglish = normalizeEnglish(track.english);
  if (normalizedEnglish && normalizedResult.includes(normalizedEnglish)) return 85;

  const englishWords = normalizedEnglish.split(" ").filter((w) => w.length > 3);
  if (englishWords.length > 0 && englishWords.every((w) => normalizedResult.includes(w))) {
    return 75;
  }

  // Very short Chinese titles (e.g. 默, 枫) must match exactly — avoids wrong song picks.
  if (track.name.length <= 2) return 0;

  return 0;
}

/** Which catalog track does this iTunes result best correspond to? */
function bestCatalogMatch(
  result: ItunesResult,
  catalog: TrackInfo[]
): { track: TrackInfo; score: number } | null {
  let best: { track: TrackInfo; score: number } | null = null;
  for (const track of catalog) {
    const score = scoreItunesMatch(result, track);
    if (!best || score > best.score) {
      best = { track, score };
    }
  }
  return best;
}

function pickValidatedResult(
  results: ItunesResult[],
  track: TrackInfo,
  catalog: TrackInfo[]
): ItunesResult | null {
  const ranked = results
    .filter((r) => r.previewUrl && !isLiveRecording(r) && isJayChouRecording(r))
    .map((r) => ({
      result: r,
      score: scoreItunesMatch(r, track),
      best: bestCatalogMatch(r, catalog),
    }))
    .filter(
      (entry) =>
        entry.score >= MIN_MATCH_SCORE &&
        entry.best !== null &&
        entry.best.track.id === track.id &&
        entry.best.score >= MIN_MATCH_SCORE
    )
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.result ?? null;
}

function buildSearchTerms(track: TrackInfo): string[] {
  return [
    `Jay Chou ${track.name}`,
    `周杰伦 ${track.name}`,
    `${track.name} Jay Chou`,
    `Jay Chou ${track.english}`,
  ];
}

async function searchItunes(term: string): Promise<ItunesResult[]> {
  const url = `${ITUNES_API}?term=${encodeURIComponent(term)}&media=music&entity=song&limit=15&country=US`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = (await res.json()) as ItunesResponse;
  return data.results ?? [];
}

export function buildChoices(
  correct: TrackInfo,
  tracks: TrackInfo[],
  count = 4
): { choices: SongChoice[]; correctIndex: number } {
  // Exclude the correct song by id AND name so distractors never duplicate its label.
  const distractorPool = tracks.filter(
    (t) => t.id !== correct.id && t.name !== correct.name
  );
  const distractors = shuffle(distractorPool).slice(0, count - 1);
  const ordered = shuffle([correct, ...distractors]);
  const choices = ordered.map((t) => ({ name: t.name, english: t.english }));
  const correctIndex = ordered.findIndex((t) => t.id === correct.id);

  if (
    correctIndex < 0 ||
    choices[correctIndex]?.name !== correct.name ||
    choices[correctIndex]?.english !== correct.english
  ) {
    throw new Error(
      `buildChoices invariant failed for "${correct.name}" (index=${correctIndex})`
    );
  }

  return { choices, correctIndex };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function randomSnippetParams(): { snippetStart: number; snippetDuration: number } {
  const snippetStart = Math.random() * 18;
  const snippetDuration = 1 + Math.random() * 2; // 1-3s
  return { snippetStart, snippetDuration };
}

export async function fetchItunesPreview(
  track: TrackInfo
): Promise<{ previewUrl: string; artworkUrl: string } | null> {
  const catalog = getJayChouSongList();

  const cached = previewCache.get(track.id);
  if (cached) {
    const cachedResult: ItunesResult = {
      trackName: cached.itunesTrackName,
      artistName: cached.itunesArtistName,
    };
    const stillValid =
      isJayChouRecording(cachedResult) &&
      scoreItunesMatch(cachedResult, track) >= MIN_MATCH_SCORE;
    if (stillValid) {
      return { previewUrl: cached.previewUrl, artworkUrl: cached.artworkUrl };
    }
    previewCache.delete(track.id);
  }

  try {
    const seen = new Set<string>();
    const allResults: ItunesResult[] = [];

    for (const term of buildSearchTerms(track)) {
      const results = await searchItunes(term);
      for (const r of results) {
        const key = r.previewUrl ?? `${r.trackName}-${r.collectionName}`;
        if (!seen.has(key)) {
          seen.add(key);
          allResults.push(r);
        }
      }
    }

    const hit = pickValidatedResult(allResults, track, catalog);
    if (!hit?.previewUrl) {
      console.warn(
        `iTunes: no validated preview for "${track.name}" (${track.english}) — skipping`
      );
      return null;
    }

    const artworkUrl = (hit.artworkUrl100 ?? "").replace("100x100bb", "600x600bb");
    const entry: CachedPreview = {
      previewUrl: hit.previewUrl,
      artworkUrl,
      itunesTrackName: hit.trackName ?? track.name,
      itunesArtistName: hit.artistName ?? "Jay Chou",
    };
    previewCache.set(track.id, entry);
    return { previewUrl: entry.previewUrl, artworkUrl: entry.artworkUrl };
  } catch (err) {
    console.error(`iTunes fetch failed for "${track.name}":`, err);
    return null;
  }
}

export async function pickTrackWithPreview(
  tracks: TrackInfo[],
  maxAttempts = 12
): Promise<{ track: TrackInfo; previewUrl: string; artworkUrl: string } | null> {
  const pool = shuffle(tracks).slice(0, maxAttempts);
  for (const track of pool) {
    const preview = await fetchItunesPreview(track);
    if (preview) return { track, ...preview };
  }
  return null;
}
