# Jay Chou Guess the Intro

A mobile-first, real-time multiplayer trivia game. Up to 4 friends join a private room, listen to synchronized Jay Chou song intros from YouTube, and compete to guess the track title fastest.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS |
| Real-time | Socket.io (custom Node server) |
| Audio | **yt-search** + **@distube/ytdl-core** (YouTube search & stream) |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (React)                      │
│  StartScreen → LobbyScreen → GameScreen → RoundReveal   │
│              useGameSocket (Socket.io client)            │
└──────────────────────────┬──────────────────────────────┘
                           │ WebSocket (/api/socket)
┌──────────────────────────▼──────────────────────────────┐
│              server.ts (HTTP + Socket.io)                 │
│  socket-server.ts — room state, round logic, scoring     │
│  youtube.ts — yt-search + ytdl snippet extraction        │
└──────────────────────────┬──────────────────────────────┘
                           │
              GET /api/audio/snippet?videoId=...
                           │
                    YouTube (via ytdl-core)
```

### Round audio flow

1. Server picks a random Jay Chou song from `jayChouSongs.ts`
2. Searches YouTube for `"[Song Name] Jay Chou"` via **yt-search**
3. Takes the top result's video ID (cached for reuse)
4. Clients play `/api/audio/snippet?videoId=...` which streams **seconds 0:01–0:03** via ytdl
5. Snippet loops 3× on each client with brief pauses (synced via `audioPlayAt`)

### Scoring

Correct answers earn placement points by speed: **1000 / 750 / 500 / 250**. Wrong answers earn 0.

## Getting started

1. Install **Node.js 18+**, then:

```bash
npm install
cp .env.example .env.local
```

2. **YouTube fallback IDs** (recommended) — edit `src/lib/fallbackTracks.ts` to paste video IDs when search fails:

```typescript
export const YOUTUBE_FALLBACK: Record<string, string> = {
  "青花瓷": "Z8McaNoZMWo",
};
```

3. Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** YouTube scraping can break when YouTube changes their internals. `@distube/ytdl-core` is a maintained fork of `ytdl-core`. If streams fail, add manual video IDs to the fallback file.

## File structure

```
src/
├── lib/
│   ├── youtube.ts           # Search, cache, snippet streaming
│   ├── jayChouSongs.ts      # Song discography list
│   ├── fallbackTracks.ts    # Manual YouTube video ID backup
│   └── socket-server.ts
├── app/api/
│   ├── audio/snippet/route.ts   # Proxies 1–3s YouTube audio
│   └── songs/route.ts
└── components/
    └── SnippetPlayer.tsx    # Loops server-trimmed clip 3×
```

## API

| Endpoint | Description |
|----------|-------------|
| `GET /api/songs` | List Jay Chou songs in the game pool |
| `GET /api/audio/snippet?videoId=xxx` | Stream seconds 1–3 of a YouTube video |

## Socket events

Same as before — see prior docs for `room:create`, `room:join`, `game:start`, `game:vote`, etc.
