/**
 * Fetch oEmbed + caption vocal-start times for Is This AI? clips.
 * Regenerates src/lib/isThisAiSongs.ts
 *
 * Usage: node scripts/fetch-ai-human-meta.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const MD_PATH =
  process.env.CHOU_MD ||
  "C:\\Users\\ashyg\\Desktop\\Map Tool\\Map Tool\\4.) Projects\\VibeCode\\Done\\ChouChallenge.md";

/** Fallback when captions are missing — skip typical intros. */
const DEFAULT_VOCAL_START_SEC = 18;

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function extractIds(md, section) {
  const re = new RegExp(
    `${section}:\\s*([\\s\\S]*?)(?=\\n(?:AI|Human):|$)`,
    "i"
  );
  const match = md.match(re);
  if (!match) return [];
  const ids = [];
  const seen = new Set();
  for (const m of match[1].matchAll(/[?&]v=([a-zA-Z0-9_-]{11})/g)) {
    const id = m[1];
    if (seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

function shortenTitle(title) {
  if (!title) return "Untitled";
  let t = title
    .replace(/^👉/, "")
    .replace(/[|｜].*$/, "")
    .replace(/『.*$/, "")
    .replace(/「.*$/, "")
    .replace(/\s+/g, " ")
    .trim();
  if (t.length > 48) t = t.slice(0, 45).trim() + "…";
  return t || title.slice(0, 48);
}

function escapeTs(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function decodeXmlEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\\n/g, " ")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function isLikelyLyric(text) {
  if (!text || text.length < 2) return false;
  if (/^\[(Music|Applause|Laughter|Silence|♪|Instrumental)/i.test(text)) return false;
  if (/^(♪+|Music|Applause)$/i.test(text)) return false;
  return /[\p{L}\p{N}]/u.test(text);
}

/** First caption cue that looks like singing/lyrics → vocal start (seconds). */
async function fetchVocalStartSec(videoId) {
  try {
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" },
    });
    if (!pageRes.ok) return null;
    const html = await pageRes.text();

    const capMatch = html.match(/"captionTracks":(\[.*?\])/);
    if (!capMatch) return null;

    let tracks;
    try {
      tracks = JSON.parse(capMatch[1]);
    } catch {
      return null;
    }
    if (!Array.isArray(tracks) || tracks.length === 0) return null;

    const prefer = (langs) =>
      tracks.find((t) => langs.some((l) => (t.languageCode || "").toLowerCase().startsWith(l)));

    const track =
      prefer(["zh", "zh-hant", "zh-hans", "zh-tw", "zh-cn", "yue"]) ||
      prefer(["en"]) ||
      tracks.find((t) => t.kind === "asr") ||
      tracks[0];

    if (!track?.baseUrl) return null;

    const capRes = await fetch(track.baseUrl, { headers: { "User-Agent": UA } });
    if (!capRes.ok) return null;
    const xml = await capRes.text();

    const cueRe = /<text\s+start="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g;
    let m;
    while ((m = cueRe.exec(xml))) {
      const start = parseFloat(m[1]);
      const text = decodeXmlEntities(m[2]);
      if (!Number.isFinite(start) || start < 0) continue;
      if (!isLikelyLyric(text)) continue;
      // Nudge back slightly so the first syllable isn't cut off.
      return Math.max(0, Math.floor(start) - 1);
    }
  } catch {
    // ignore
  }
  return null;
}

async function fetchMeta(id) {
  const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(
    `https://www.youtube.com/watch?v=${id}`
  )}&format=json`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) return { id, error: res.status };
    const data = await res.json();
    const vocalStartSec = await fetchVocalStartSec(id);
    return {
      id,
      title: data.title,
      author: data.author_name,
      thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
      vocalStartSec:
        vocalStartSec != null ? vocalStartSec : DEFAULT_VOCAL_START_SEC,
      vocalStartSource: vocalStartSec != null ? "captions" : "default",
    };
  } catch (e) {
    return { id, error: String(e) };
  }
}

async function fetchAll(ids, label) {
  const results = [];
  for (const id of ids) {
    const m = await fetchMeta(id);
    results.push(m);
    const start =
      m.vocalStartSec != null
        ? `start=${m.vocalStartSec}s (${m.vocalStartSource})`
        : "";
    console.log(label, id, m.title || m.error, start);
    await new Promise((r) => setTimeout(r, 120));
  }
  return results;
}

const md = readFileSync(MD_PATH, "utf8");
const aiIds = extractIds(md, "AI");
const humanIds = extractIds(md, "Human");

console.log(`Found ${aiIds.length} AI + ${humanIds.length} Human IDs`);

const out = {
  ai: await fetchAll(aiIds, "AI"),
  human: await fetchAll(humanIds, "Human"),
};

writeFileSync(
  resolve(ROOT, "scripts/ai-human-meta.json"),
  JSON.stringify(out, null, 2)
);
console.log("wrote scripts/ai-human-meta.json");

const okAi = out.ai.filter((m) => m.title && !m.error);
const okHuman = out.human.filter((m) => m.title && !m.error);
const skipped = [...out.ai, ...out.human].filter((m) => m.error);
const captionHits = [...okAi, ...okHuman].filter((m) => m.vocalStartSource === "captions").length;

function clipLines(items, label) {
  return items
    .map((m) => {
      const name = escapeTs(shortenTitle(m.title));
      const author = escapeTs(m.author || "YouTube");
      const start = Number.isFinite(m.vocalStartSec)
        ? m.vocalStartSec
        : DEFAULT_VOCAL_START_SEC;
      return `  clip("${m.id}", "${label}", "${name}", "${author}", ${start}),`;
    })
    .join("\n");
}

const ts = `/**
 * "Is This AI?" catalog — labeled YouTube clips (no audio API).
 * Thumbnails: https://img.youtube.com/vi/{id}/hqdefault.jpg
 * snippetStart prefers first caption lyric cue (see scripts/fetch-ai-human-meta.mjs)
 */
import type { TrackInfo } from "@/types/game";

export type AiHumanLabel = "AI" | "Human";

export interface AiClipTrack extends TrackInfo {
  youtubeVideoId: string;
  aiLabel: AiHumanLabel;
  /** Preferred clip start (seconds) — ideally where vocals begin. */
  snippetStart: number;
}

function clip(
  youtubeVideoId: string,
  aiLabel: AiHumanLabel,
  name: string,
  english: string,
  snippetStart: number
): AiClipTrack {
  return {
    id: \`yt-\${youtubeVideoId}\`,
    name,
    english,
    youtubeVideoId,
    aiLabel,
    snippetStart,
    artworkUrl: \`https://img.youtube.com/vi/\${youtubeVideoId}/hqdefault.jpg\`,
  };
}

/** Short display titles for the UI (channel/author kept as english). */
export const IS_THIS_AI_CLIPS: AiClipTrack[] = [
  // AI (${okAi.length})
${clipLines(okAi, "AI")}

  // Human (${okHuman.length})
${clipLines(okHuman, "Human")}
];

export const AI_OR_HUMAN_CHOICES = [
  { name: "AI", english: "Generated / AI cover" },
  { name: "Human", english: "Real human performance" },
] as const;

export function getIsThisAiSongList(): TrackInfo[] {
  return IS_THIS_AI_CLIPS;
}

export function getAiClipById(id: string): AiClipTrack | undefined {
  return IS_THIS_AI_CLIPS.find((c) => c.id === id);
}

export {
  youtubeWatchUrl,
  youtubeEmbedUrl,
} from "./youtubeEmbed";
`;

writeFileSync(resolve(ROOT, "src/lib/isThisAiSongs.ts"), ts);
console.log(
  `wrote isThisAiSongs.ts — ${okAi.length} AI, ${okHuman.length} Human, caption starts: ${captionHits}` +
    (skipped.length ? ` (skipped ${skipped.length}: ${skipped.map((s) => s.id).join(", ")})` : "")
);
