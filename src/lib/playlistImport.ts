/**
 * Import public Spotify / YouTube playlists as TrackInfo catalogs.
 * Spotify: embed page __NEXT_DATA__ (includes preview URLs when available).
 * YouTube: playlist page ytInitialData lockupViewModel entries.
 */
import type { TrackInfo } from "@/types/game";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const MAX_TRACKS = 100;
const UI_TITLE_BLOCKLIST = new Set([
  "add to queue",
  "save to playlist",
  "share",
  "watch later",
  "remove from",
]);

export type PlaylistSource = "spotify" | "youtube";

export interface ImportedPlaylist {
  source: PlaylistSource;
  url: string;
  title: string;
  tracks: TrackInfo[];
}

export function parsePlaylistUrl(
  raw: string
): { source: PlaylistSource; id: string; url: string } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const u = new URL(withProtocol);

    // Spotify
    if (
      u.hostname.includes("spotify.com") ||
      trimmed.startsWith("spotify:playlist:")
    ) {
      const fromUri = trimmed.match(/spotify:playlist:([a-zA-Z0-9]+)/);
      const fromPath = u.pathname.match(/\/playlist\/([a-zA-Z0-9]+)/);
      const id = fromUri?.[1] ?? fromPath?.[1];
      if (!id) return null;
      return {
        source: "spotify",
        id,
        url: `https://open.spotify.com/playlist/${id}`,
      };
    }

    // YouTube / YouTube Music
    if (
      u.hostname.includes("youtube.com") ||
      u.hostname.includes("youtu.be") ||
      u.hostname.includes("music.youtube.com")
    ) {
      const id = u.searchParams.get("list");
      if (!id) return null;
      return {
        source: "youtube",
        id,
        url: `https://www.youtube.com/playlist?list=${id}`,
      };
    }
  } catch {
    return null;
  }

  return null;
}

function slugId(value: string, index: number): string {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${base || "track"}-${index}`;
}

function cleanDisplayText(value: string): string {
  return value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function stripYoutubeNoise(title: string): string {
  return cleanDisplayText(
    title
      .replace(/\[[^\]]*]/g, " ")
      .replace(/\([^)]*(official|lyric|audio|video|hd|hq|mv)[^)]*\)/gi, " ")
      .replace(/\|\s*.*$/g, " ")
      .replace(/\s{2,}/g, " ")
  );
}

/** Prefer "Artist - Song" from YouTube titles; fall back to channel as artist. */
export function parseYoutubeTitle(
  rawTitle: string,
  channel?: string
): { name: string; english: string } {
  const cleaned = stripYoutubeNoise(rawTitle);
  const parts = cleaned.split(/\s+-\s+/);
  if (parts.length >= 2) {
    const english = cleanDisplayText(parts[0]);
    const name = cleanDisplayText(parts.slice(1).join(" - "));
    if (name && english) return { name, english };
  }
  return {
    name: cleaned || rawTitle.trim(),
    english: cleanDisplayText(channel || "Unknown Artist"),
  };
}

function dedupeTracks(tracks: TrackInfo[]): TrackInfo[] {
  const seen = new Set<string>();
  return tracks.filter((t) => {
    const key = `${t.name.toLowerCase()}|${t.english.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function importSpotifyPlaylist(id: string, url: string): Promise<ImportedPlaylist> {
  const res = await fetch(`https://open.spotify.com/embed/playlist/${id}`, {
    headers: { "User-Agent": UA, Accept: "text/html" },
  });
  if (!res.ok) {
    throw new Error(`Could not load Spotify playlist (${res.status}).`);
  }
  const html = await res.text();
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) {
    throw new Error("Could not read Spotify playlist data. Is the playlist public?");
  }

  const data = JSON.parse(match[1]) as {
    props?: {
      pageProps?: {
        state?: {
          data?: {
            entity?: {
              name?: string;
              title?: string;
              coverArt?: { sources?: { url: string; width?: number }[] };
              trackList?: {
                uri?: string;
                title?: string;
                subtitle?: string;
                audioPreview?: { url?: string };
              }[];
            };
          };
        };
      };
    };
  };

  const entity = data.props?.pageProps?.state?.data?.entity;
  if (!entity?.trackList?.length) {
    throw new Error("No songs found. Make sure the Spotify playlist is public.");
  }

  const cover =
    entity.coverArt?.sources?.slice().sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]
      ?.url ?? "";

  const tracks: TrackInfo[] = entity.trackList
    .filter((t) => t.title && t.subtitle)
    .slice(0, MAX_TRACKS)
    .map((t, index) => ({
      id: slugId(t.uri ?? t.title!, index),
      name: cleanDisplayText(t.title!),
      english: cleanDisplayText(t.subtitle!),
      previewUrl: t.audioPreview?.url,
      artworkUrl: cover || undefined,
    }));

  if (tracks.length === 0) {
    throw new Error("No usable songs found in that Spotify playlist.");
  }

  return {
    source: "spotify",
    url,
    title: cleanDisplayText(entity.name || entity.title || "Spotify Playlist"),
    tracks: dedupeTracks(tracks),
  };
}

async function importYoutubePlaylist(id: string, url: string): Promise<ImportedPlaylist> {
  const res = await fetch(`https://www.youtube.com/playlist?list=${id}`, {
    headers: {
      "User-Agent": UA,
      "Accept-Language": "en-US,en;q=0.9",
      Cookie: "CONSENT=YES+1",
    },
  });
  if (!res.ok) {
    throw new Error(`Could not load YouTube playlist (${res.status}).`);
  }
  const html = await res.text();
  // Avoid the /s (dotAll) flag — tsconfig targets ES2017 and Next build typechecks fail on it.
  const start = html.search(/ytInitialData\s*=\s*\{/);
  if (start < 0) {
    throw new Error("Could not read YouTube playlist data. Is the playlist public?");
  }
  const braceStart = html.indexOf("{", start);
  let depth = 0;
  let end = -1;
  for (let i = braceStart; i < html.length; i++) {
    const ch = html[i];
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end < 0) {
    throw new Error("Could not parse YouTube playlist data.");
  }

  const data = JSON.parse(html.slice(braceStart, end + 1)) as Record<string, unknown>;
  const playlistTitle =
    (
      data as {
        metadata?: {
          playlistMetadataRenderer?: { title?: string };
        };
        header?: {
          playlistHeaderRenderer?: { title?: { simpleText?: string; runs?: { text: string }[] } };
        };
      }
    ).metadata?.playlistMetadataRenderer?.title ||
    (
      data as {
        header?: {
          playlistHeaderRenderer?: { title?: { simpleText?: string; runs?: { text: string }[] } };
        };
      }
    ).header?.playlistHeaderRenderer?.title?.simpleText ||
    (
      data as {
        header?: {
          playlistHeaderRenderer?: { title?: { runs?: { text: string }[] } };
        };
      }
    ).header?.playlistHeaderRenderer?.title?.runs?.[0]?.text ||
    "YouTube Playlist";

  type Lockup = {
    contentId?: string;
    metadata?: {
      lockupMetadataViewModel?: {
        title?: { content?: string };
        metadata?: {
          contentMetadataViewModel?: {
            metadataRows?: {
              metadataParts?: { text?: { content?: string } }[];
            }[];
          };
        };
      };
    };
  };

  const lockups: Lockup[] = [];
  function collect(node: unknown) {
    if (!node || typeof node !== "object") return;
    const obj = node as Record<string, unknown>;
    if (obj.lockupViewModel) {
      lockups.push(obj.lockupViewModel as Lockup);
      return;
    }
    if (Array.isArray(node)) node.forEach(collect);
    else Object.values(obj).forEach(collect);
  }
  collect(data);

  const tracks: TrackInfo[] = [];
  for (const lockup of lockups) {
    if (tracks.length >= MAX_TRACKS) break;
    const rawTitle = lockup.metadata?.lockupMetadataViewModel?.title?.content?.trim();
    if (!rawTitle) continue;
    if (UI_TITLE_BLOCKLIST.has(rawTitle.toLowerCase())) continue;

    const channel =
      lockup.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel
        ?.metadataRows?.[0]?.metadataParts?.[0]?.text?.content;
    const { name, english } = parseYoutubeTitle(rawTitle, channel);
    if (!name || name.length < 2) continue;

    tracks.push({
      id: slugId(lockup.contentId ?? name, tracks.length),
      name,
      english,
    });
  }

  if (tracks.length === 0) {
    throw new Error("No songs found. Make sure the YouTube playlist is public.");
  }

  return {
    source: "youtube",
    url,
    title: cleanDisplayText(playlistTitle),
    tracks: dedupeTracks(tracks),
  };
}

export async function importPlaylistFromUrl(rawUrl: string): Promise<ImportedPlaylist> {
  const parsed = parsePlaylistUrl(rawUrl);
  if (!parsed) {
    throw new Error(
      "Paste a public Spotify or YouTube playlist link (open.spotify.com/playlist/… or youtube.com/playlist?list=…)."
    );
  }

  if (parsed.source === "spotify") {
    return importSpotifyPlaylist(parsed.id, parsed.url);
  }
  return importYoutubePlaylist(parsed.id, parsed.url);
}
