/**
 * Fetch oEmbed metadata for Is This AI? clips and regenerate src/lib/isThisAiSongs.ts catalog.
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

async function fetchMeta(id) {
  const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(
    `https://www.youtube.com/watch?v=${id}`
  )}&format=json`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    if (!res.ok) return { id, error: res.status };
    const data = await res.json();
    return {
      id,
      title: data.title,
      author: data.author_name,
      thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
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
    console.log(label, id, m.title || m.error);
    await new Promise((r) => setTimeout(r, 80));
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

function clipLines(items, label) {
  return items
    .map((m) => {
      const name = escapeTs(shortenTitle(m.title));
      const author = escapeTs(m.author || "YouTube");
      return `  clip("${m.id}", "${label}", "${name}", "${author}"),`;
    })
    .join("\n");
}

const ts = `/**
 * "Is This AI?" catalog — labeled YouTube clips (no audio API).
 * Thumbnails: https://img.youtube.com/vi/{id}/hqdefault.jpg
 * Regenerated from ChouChallenge.md via scripts/fetch-ai-human-meta.mjs
 */
import type { TrackInfo } from "@/types/game";

export type AiHumanLabel = "AI" | "Human";

export interface AiClipTrack extends TrackInfo {
  youtubeVideoId: string;
  aiLabel: AiHumanLabel;
}

function clip(
  youtubeVideoId: string,
  aiLabel: AiHumanLabel,
  name: string,
  english: string
): AiClipTrack {
  return {
    id: \`yt-\${youtubeVideoId}\`,
    name,
    english,
    youtubeVideoId,
    aiLabel,
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
  `wrote isThisAiSongs.ts — ${okAi.length} AI, ${okHuman.length} Human` +
    (skipped.length ? ` (skipped ${skipped.length}: ${skipped.map((s) => s.id).join(", ")})` : "")
);
