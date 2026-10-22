import type { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import {
  calculateRoundScores,
  generateRoomCode,
  isTieForFirst,
} from "./gameLogic";
import {
  buildChoices,
  pickTrackWithPreview,
  randomSnippetParams,
} from "./itunes";
import {
  AI_OR_HUMAN_CHOICES,
  getAiClipById,
  youtubeWatchUrl,
} from "./isThisAiSongs";
import { getTracksForMode, isValidGameMode } from "./tracks";
import { importPlaylistFromUrl } from "./playlistImport";
import type {
  ClientRoomView,
  Player,
  ReviewPlayback,
  RoomState,
} from "@/types/game";
import {
  AI_CLIP_DURATION_SEC,
  AI_ROUND_TIMER_SECONDS,
  AUDIO_PLAY_DELAY_MS,
  AUDIO_SYNC_MAX_WAIT_MS,
  DEFAULT_CHOICES,
  DEFAULT_GAME_MODE,
  DEFAULT_ROUNDS,
  type GameMode,
  MAX_CHOICES,
  MAX_PLAYERS,
  MAX_ROUNDS,
  MIN_CHOICES,
  MIN_ROUNDS,
  REVIEW_PLAY_DELAY_MS,
  ROUND_TIMER_SECONDS,
} from "@/types/game";

type ReviewPlayPayload = {
  youtubeVideoId: string;
  title?: string;
  artist?: string;
  aiLabel?: "AI" | "Human";
  artworkUrl?: string;
  snippetStart?: number;
  snippetDuration?: number;
};

const rooms = new Map<string, RoomState>();
const playerToRoom = new Map<string, string>();
const roundTimers = new Map<string, NodeJS.Timeout>();
const audioSyncTimers = new Map<string, NodeJS.Timeout>();

function getRoom(code: string): RoomState | undefined {
  return rooms.get(code.toUpperCase());
}

function toClientView(room: RoomState, playerId: string): ClientRoomView {
  const player = room.players.find((p) => p.id === playerId);
  const base: ClientRoomView = {
    code: room.code,
    hostId: room.hostId,
    players: room.players.map(({ socketId: _, ...rest }) => rest),
    settings: room.settings,
    phase: room.phase,
    currentRound: room.currentRound,
    suddenDeath: room.suddenDeath,
    playlistStatus: room.playlistStatus,
    playlistError: room.playlistError,
    tracks: room.tracks.map(({ id, name, english }) => ({ id, name, english })),
    roundResult: room.roundResult,
    playedClips: room.playedClips ?? [],
    usedTrackIds: room.usedTrackIds ?? [],
    reviewPlayback: room.reviewPlayback ?? null,
    showCoverBrowser: room.showCoverBrowser ?? false,
  };

  if (room.round && room.phase === "playing") {
    const hasVoted = player ? room.round.votes[player.id] !== undefined && room.round.votes[player.id] !== null : false;
    const myVote = player ? (room.round.votes[player.id] ?? null) : null;
    base.round = {
      roundNumber: room.round.roundNumber,
      trackId: room.round.trackId,
      choices: room.round.choices,
      previewUrl: room.round.previewUrl,
      artworkUrl: room.round.artworkUrl,
      snippetStart: room.round.snippetStart,
      snippetDuration: room.round.snippetDuration,
      roundStartTime: room.round.roundStartTime,
      timerSeconds: room.round.timerSeconds,
      audioPlayAt: room.round.audioPlayAt,
      audioSyncing: room.round.audioPlayAt === 0,
      syncReadyCount: room.players.filter((p) => room.round!.audioReady[p.id]).length,
      syncTotalPlayers: room.players.length,
      hasVoted,
      myVote: hasVoted ? myVote : null,
      mediaType: room.round.mediaType ?? "preview",
      youtubeVideoId: room.round.youtubeVideoId,
    };
  }

  if (room.roundResult && (room.phase === "roundEnd" || room.phase === "gameOver")) {
    base.roundResult = room.roundResult;
  }

  return base;
}

function broadcastRoom(io: Server, room: RoomState) {
  room.players.forEach((player) => {
    io.to(player.socketId).emit("room:update", toClientView(room, player.id));
  });
}

function clearRoundTimer(code: string) {
  const timer = roundTimers.get(code);
  if (timer) {
    clearTimeout(timer);
    roundTimers.delete(code);
  }
}

function clearAudioSyncTimer(code: string) {
  const timer = audioSyncTimers.get(code);
  if (timer) {
    clearTimeout(timer);
    audioSyncTimers.delete(code);
  }
}

function beginRoundAudio(io: Server, room: RoomState) {
  if (!room.round || room.round.audioPlayAt > 0) return;

  clearAudioSyncTimer(room.code);
  const now = Date.now();
  // Mark the room as past sync — do NOT start the guess timer.
  // Timer only starts on game:clipStarted (someone tapped Sync & play).
  room.round.audioPlayAt = now + AUDIO_PLAY_DELAY_MS;
  room.round.roundStartTime = 0;

  broadcastRoom(io, room);
}

/** Start the guess countdown once a player has actually started the clip. */
function beginRoundTimer(io: Server, room: RoomState) {
  if (!room.round || room.phase !== "playing") return;
  if (room.round.roundStartTime > 0) return;

  clearRoundTimer(room.code);
  const now = Date.now();
  room.round.roundStartTime = now;
  const timerSeconds = room.round.timerSeconds || ROUND_TIMER_SECONDS;
  const timer = setTimeout(() => {
    endRound(io, room.code);
  }, timerSeconds * 1000);
  roundTimers.set(room.code, timer);

  broadcastRoom(io, room);
}

function maybeStartRoundAudio(io: Server, code: string) {
  const room = getRoom(code);
  if (!room?.round || room.phase !== "playing" || room.round.audioPlayAt > 0) return;

  const allReady = room.players.every((p) => room.round!.audioReady[p.id]);
  if (!allReady) return;

  beginRoundAudio(io, room);
}

function allPlayersVoted(room: RoomState): boolean {
  if (!room.round) return false;
  return room.players.every(
    (p) => room.round!.votes[p.id] !== undefined && room.round!.votes[p.id] !== null
  );
}

function endRound(io: Server, code: string) {
  const room = getRoom(code);
  if (!room || !room.round || room.phase !== "playing") return;

  clearRoundTimer(code);
  clearAudioSyncTimer(code);

  try {
    const activeRound = room.round;
    // No answer = 0 points (explicit null so rankings show "No answer").
    room.players.forEach((p) => {
      if (activeRound.votes[p.id] === undefined) {
        activeRound.votes[p.id] = null;
      }
    });
    const result = calculateRoundScores(activeRound, room.players);

    if (activeRound.mediaType === "youtube" && activeRound.youtubeVideoId) {
      const clip = getAiClipById(activeRound.trackId);
      const aiLabel =
        clip?.aiLabel ?? (activeRound.correctAnswer === "AI" ? "AI" : "Human");
      result.aiLabel = aiLabel;
      result.songTitle = clip?.name ?? activeRound.correctEnglish;
      result.songArtist = clip?.english ?? "";
      result.youtubeVideoId = activeRound.youtubeVideoId;

      room.playedClips = room.playedClips ?? [];
      room.playedClips.push({
        roundNumber: activeRound.roundNumber,
        aiLabel,
        title: result.songTitle,
        artist: result.songArtist,
        youtubeVideoId: activeRound.youtubeVideoId,
        youtubeUrl: youtubeWatchUrl(activeRound.youtubeVideoId),
        artworkUrl: activeRound.artworkUrl,
        snippetStart: activeRound.snippetStart,
        snippetDuration: activeRound.snippetDuration,
      });
    }

    room.roundResult = result;

    room.players.forEach((p) => {
      p.score += result.scoresEarned[p.id] ?? 0;
    });

    room.phase = "roundEnd";
    room.round = undefined;
    broadcastRoom(io, room);
  } catch (err) {
    console.error("endRound failed:", err);
    // Still advance so clients never stall on 0s.
    room.phase = "roundEnd";
    if (!room.roundResult && room.round) {
      room.roundResult = calculateRoundScores(room.round, room.players);
    }
    room.round = undefined;
    broadcastRoom(io, room);
  }
}

async function startNextRound(io: Server, code: string) {
  const room = getRoom(code);
  if (!room) return;

  const gameMode = room.settings.gameMode ?? DEFAULT_GAME_MODE;
  // Custom playlists stay on the room; built-in modes reload from catalogs.
  const tracks =
    gameMode === "custom" ? room.tracks : getTracksForMode(gameMode);
  room.tracks = tracks;
  room.usedTrackIds = room.usedTrackIds ?? [];
  room.playedClips = room.playedClips ?? [];

  const isAiMode = gameMode === "isThisAi";
  const choiceCount = isAiMode ? 2 : room.settings.choiceCount ?? DEFAULT_CHOICES;
  const minTracks = isAiMode ? 1 : choiceCount;

  if (tracks.length < minTracks) {
    const host = room.players.find((p) => p.id === room.hostId);
    if (host) {
      io.to(host.socketId).emit("error", {
        message: "Not enough songs in discography.",
      });
    }
    room.phase = "lobby";
    broadcastRoom(io, room);
    return;
  }

  room.currentRound += 1;

  const audioReady: Record<string, boolean> = {};
  room.players.forEach((p) => {
    audioReady[p.id] = false;
  });

  if (isAiMode) {
    const unused = tracks.filter((t) => !room.usedTrackIds.includes(t.id));
    const pool = unused.length > 0 ? unused : tracks;
    const track = pool[Math.floor(Math.random() * pool.length)];
    const clip = getAiClipById(track.id);
    if (!clip?.youtubeVideoId) {
      room.currentRound -= 1;
      room.phase = "lobby";
      broadcastRoom(io, room);
      return;
    }

    room.usedTrackIds.push(track.id);
    const correctIndex = clip.aiLabel === "AI" ? 0 : 1;
    // Prefer caption-derived vocal start baked into the catalog.
    const snippetStart = Math.max(
      0,
      Math.floor(
        typeof clip.snippetStart === "number" && Number.isFinite(clip.snippetStart)
          ? clip.snippetStart
          : 18
      )
    );
    const snippetDuration = AI_CLIP_DURATION_SEC;

    room.round = {
      roundNumber: room.currentRound,
      trackId: track.id,
      correctAnswer: clip.aiLabel,
      correctEnglish: clip.name,
      correctChoiceIndex: correctIndex,
      choices: AI_OR_HUMAN_CHOICES.map((c) => ({ name: c.name, english: c.english })),
      previewUrl: "",
      artworkUrl: clip.artworkUrl ?? "",
      snippetStart,
      snippetDuration,
      votes: {},
      voteTimes: {},
      roundStartTime: 0,
      timerSeconds: AI_ROUND_TIMER_SECONDS,
      audioPlayAt: 0,
      audioReady,
      mediaType: "youtube",
      youtubeVideoId: clip.youtubeVideoId,
    };
  } else {
    const resolved = await pickTrackWithPreview(tracks, gameMode);
    if (!resolved) {
      const host = room.players.find((p) => p.id === room.hostId);
      if (host) {
        io.to(host.socketId).emit("error", {
          message: "Could not load audio previews from iTunes. Try again.",
        });
      }
      room.currentRound -= 1;
      room.phase = "lobby";
      broadcastRoom(io, room);
      return;
    }

    const { track, previewUrl, artworkUrl } = resolved;
    const { choices, correctIndex } = buildChoices(track, tracks, choiceCount);
    const { snippetStart, snippetDuration } = randomSnippetParams();

    room.round = {
      roundNumber: room.currentRound,
      trackId: track.id,
      correctAnswer: track.name,
      correctEnglish: track.english,
      correctChoiceIndex: correctIndex,
      choices,
      previewUrl,
      artworkUrl,
      snippetStart,
      snippetDuration,
      votes: {},
      voteTimes: {},
      roundStartTime: 0,
      timerSeconds: ROUND_TIMER_SECONDS,
      audioPlayAt: 0,
      audioReady,
      mediaType: "preview",
    };
  }

  room.phase = "playing";
  room.roundResult = undefined;
  broadcastRoom(io, room);

  clearRoundTimer(code);
  clearAudioSyncTimer(code);
  // YouTube / Sync & play rounds wait indefinitely for a tap — no auto-unlock.
  if (room.round.mediaType !== "youtube") {
    const syncTimer = setTimeout(() => {
      const r = getRoom(code);
      if (r) beginRoundAudio(io, r);
    }, AUDIO_SYNC_MAX_WAIT_MS);
    audioSyncTimers.set(code, syncTimer);
  }
}

function removePlayer(io: Server, playerId: string) {
  const roomCode = playerToRoom.get(playerId);
  if (!roomCode) return;

  const room = getRoom(roomCode);
  if (!room) return;

  playerToRoom.delete(playerId);
  room.players = room.players.filter((p) => p.id !== playerId);

  if (room.players.length === 0) {
    clearRoundTimer(roomCode);
    rooms.delete(roomCode);
    return;
  }

  if (room.hostId === playerId) {
    room.players.forEach((p) => {
      p.isHost = false;
    });
    room.hostId = room.players[0].id;
    room.players[0].isHost = true;
  }

  broadcastRoom(io, room);
}

export function initSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    path: "/api/socket",
  });

  io.on("connection", (socket: Socket) => {
    let currentPlayerId: string | null = null;

    socket.on("room:create", async ({ nickname }: { nickname: string }) => {
      const playerId = uuidv4();
      currentPlayerId = playerId;

      let code = generateRoomCode();
      while (rooms.has(code)) {
        code = generateRoomCode();
      }

      const tracks = getTracksForMode(DEFAULT_GAME_MODE);

      const player: Player = {
        id: playerId,
        nickname: nickname.trim().slice(0, 20) || "Player",
        isHost: true,
        isReady: false,
        score: 0,
        socketId: socket.id,
      };

      const room: RoomState = {
        code,
        hostId: playerId,
        players: [player],
        settings: {
          rounds: DEFAULT_ROUNDS,
          choiceCount: DEFAULT_CHOICES,
          gameMode: DEFAULT_GAME_MODE,
        },
        phase: "lobby",
        currentRound: 0,
        suddenDeath: false,
        playlistStatus: "idle",
        tracks,
        playedClips: [],
        usedTrackIds: [],
        reviewPlayback: null,
        showCoverBrowser: false,
      };

      rooms.set(code, room);
      playerToRoom.set(playerId, code);
      socket.join(code);

      socket.emit("room:joined", { playerId, room: toClientView(room, playerId) });
    });

    socket.on("room:join", async ({ nickname, code }: { nickname: string; code: string }) => {
      const room = getRoom(code);
      if (!room) {
        socket.emit("error", { message: "Room not found" });
        return;
      }
      if (room.players.length >= MAX_PLAYERS) {
        socket.emit("error", { message: "Room is full (max 4 players)" });
        return;
      }
      if (room.phase !== "lobby") {
        socket.emit("error", { message: "Game already in progress" });
        return;
      }

      const playerId = uuidv4();
      currentPlayerId = playerId;

      const player: Player = {
        id: playerId,
        nickname: nickname.trim().slice(0, 20) || "Player",
        isHost: false,
        isReady: false,
        score: 0,
        socketId: socket.id,
      };

      room.players.push(player);
      playerToRoom.set(playerId, room.code);
      socket.join(room.code);

      socket.emit("room:joined", { playerId, room: toClientView(room, playerId) });
      broadcastRoom(io, room);
    });

    socket.on("room:ready", ({ isReady }: { isReady: boolean }) => {
      if (!currentPlayerId) return;
      const roomCode = playerToRoom.get(currentPlayerId);
      if (!roomCode) return;
      const room = getRoom(roomCode);
      if (!room) return;

      const player = room.players.find((p) => p.id === currentPlayerId);
      if (!player) return;

      player.isReady = isReady;
      broadcastRoom(io, room);
    });

    socket.on(
      "room:settings",
      async ({
        rounds,
        choiceCount,
        gameMode,
        playlistUrl,
        clearCustomPlaylist,
      }: {
        rounds?: number;
        choiceCount?: number;
        gameMode?: GameMode;
        playlistUrl?: string;
        clearCustomPlaylist?: boolean;
      }) => {
        if (!currentPlayerId) return;
        const roomCode = playerToRoom.get(currentPlayerId);
        if (!roomCode) return;
        const room = getRoom(roomCode);
        if (!room || room.hostId !== currentPlayerId) return;
        if (room.phase !== "lobby") return;

        if (rounds !== undefined) {
          room.settings.rounds = Math.min(MAX_ROUNDS, Math.max(MIN_ROUNDS, rounds));
        }
        if (choiceCount !== undefined) {
          room.settings.choiceCount = Math.min(
            MAX_CHOICES,
            Math.max(MIN_CHOICES, choiceCount)
          );
        }

        const applyBuiltInMode = (mode: GameMode) => {
          room.settings.gameMode = mode;
          room.settings.customPlaylistUrl = undefined;
          room.settings.customPlaylistTitle = undefined;
          room.playlistStatus = "idle";
          room.playlistError = undefined;
          room.tracks = getTracksForMode(mode);
        };

        if (clearCustomPlaylist) {
          applyBuiltInMode("jayChou");
          broadcastRoom(io, room);
          return;
        }

        if (playlistUrl !== undefined) {
          const raw = playlistUrl.trim();
          if (!raw) {
            applyBuiltInMode("jayChou");
            broadcastRoom(io, room);
            return;
          }

          room.settings.gameMode = "custom";
          room.settings.customPlaylistUrl = raw;
          room.settings.customPlaylistTitle = undefined;
          room.playlistStatus = "loading";
          room.playlistError = undefined;
          room.tracks = [];
          broadcastRoom(io, room);

          try {
            const imported = await importPlaylistFromUrl(raw);
            // Host may have switched modes while we were loading.
            if (room.settings.gameMode !== "custom") return;
            if ((room.settings.customPlaylistUrl ?? "").trim() !== raw) return;

            const minNeeded = room.settings.choiceCount ?? DEFAULT_CHOICES;
            if (imported.tracks.length < minNeeded) {
              room.playlistStatus = "error";
              room.playlistError = `Need at least ${minNeeded} songs (found ${imported.tracks.length}).`;
              room.tracks = [];
              broadcastRoom(io, room);
              return;
            }

            room.settings.customPlaylistUrl = imported.url;
            room.settings.customPlaylistTitle = imported.title;
            room.tracks = imported.tracks;
            room.playlistStatus = "ready";
            room.playlistError = undefined;
            broadcastRoom(io, room);
          } catch (err) {
            if (room.settings.gameMode !== "custom") return;
            room.playlistStatus = "error";
            room.playlistError =
              err instanceof Error ? err.message : "Failed to import playlist.";
            room.tracks = [];
            broadcastRoom(io, room);
          }
          return;
        }

        if (gameMode !== undefined && isValidGameMode(gameMode) && gameMode !== "custom") {
          applyBuiltInMode(gameMode);
        }

        broadcastRoom(io, room);
      }
    );

    socket.on("game:start", async () => {
      if (!currentPlayerId) return;
      const roomCode = playerToRoom.get(currentPlayerId);
      if (!roomCode) return;
      const room = getRoom(roomCode);
      if (!room || room.hostId !== currentPlayerId) return;

      const allReady = room.players.every((p) => p.isReady);
      if (!allReady) {
        socket.emit("error", { message: "All players must be ready" });
        return;
      }

      if (room.settings.gameMode === "custom") {
        if (room.playlistStatus === "loading") {
          socket.emit("error", { message: "Still loading your playlist…" });
          return;
        }
        if (room.playlistStatus !== "ready" || room.tracks.length === 0) {
          socket.emit("error", {
            message: room.playlistError || "Load a valid playlist before starting.",
          });
          return;
        }
      }

      room.players.forEach((p) => {
        p.score = 0;
        p.isReady = false;
      });
      room.currentRound = 0;
      room.suddenDeath = false;
      room.playedClips = [];
      room.usedTrackIds = [];
      room.reviewPlayback = null;
      room.showCoverBrowser = false;
      await startNextRound(io, room.code);
    });

    socket.on("game:audioReady", () => {
      if (!currentPlayerId) return;
      const roomCode = playerToRoom.get(currentPlayerId);
      if (!roomCode) return;
      const room = getRoom(roomCode);
      if (!room?.round || room.phase !== "playing" || room.round.audioPlayAt > 0) return;

      room.round.audioReady[currentPlayerId] = true;
      broadcastRoom(io, room);
      maybeStartRoundAudio(io, roomCode);
    });

    socket.on("game:clipStarted", () => {
      if (!currentPlayerId) return;
      const roomCode = playerToRoom.get(currentPlayerId);
      if (!roomCode) return;
      const room = getRoom(roomCode);
      if (!room?.round || room.phase !== "playing") return;
      // Sync & play may emit clipStarted in the same gesture as audioReady —
      // ensure audio is unlocked before starting the timer.
      if (room.round.audioPlayAt <= 0) {
        beginRoundAudio(io, room);
      }
      beginRoundTimer(io, room);
    });

    socket.on("game:vote", ({ choiceIndex }: { choiceIndex: number }) => {
      if (!currentPlayerId) return;
      const roomCode = playerToRoom.get(currentPlayerId);
      if (!roomCode) return;
      const room = getRoom(roomCode);
      if (!room || !room.round || room.phase !== "playing") return;

      if (room.round.votes[currentPlayerId] !== undefined) return;

      const index = Number(choiceIndex);
      if (!Number.isInteger(index) || index < 0 || index >= room.round.choices.length) {
        return;
      }

      room.round.votes[currentPlayerId] = index;
      room.round.voteTimes[currentPlayerId] = Date.now();

      broadcastRoom(io, room);

      if (allPlayersVoted(room)) {
        endRound(io, room.code);
      }
    });

    /** Client timer hit 0 — ends round even if nobody answered (0 points). */
    socket.on("game:timerExpired", () => {
      if (!currentPlayerId) return;
      const roomCode = playerToRoom.get(currentPlayerId);
      if (!roomCode) return;
      const room = getRoom(roomCode);
      if (!room || !room.round || room.phase !== "playing") return;
      if (room.round.audioPlayAt <= 0) return;

      const elapsed = Date.now() - room.round.roundStartTime;
      const limitMs = (room.round.timerSeconds || ROUND_TIMER_SECONDS) * 1000;
      // Allow early fire for clock skew / late audioPlayAt alignment.
      if (elapsed < limitMs - 2500) return;

      endRound(io, room.code);
    });

    socket.on("game:nextRound", async () => {
      if (!currentPlayerId) return;
      const roomCode = playerToRoom.get(currentPlayerId);
      if (!roomCode) return;
      const room = getRoom(roomCode);
      if (!room || room.hostId !== currentPlayerId) return;
      if (room.phase !== "roundEnd") return;

      room.reviewPlayback = null;
      room.showCoverBrowser = false;

      const regularSeasonComplete = room.currentRound >= room.settings.rounds;

      if (regularSeasonComplete) {
        if (isTieForFirst(room.players)) {
          room.suddenDeath = true;
          await startNextRound(io, room.code);
          return;
        }
        room.suddenDeath = false;
        room.phase = "gameOver";
        room.roundResult = undefined;
        broadcastRoom(io, room);
        return;
      }

      await startNextRound(io, room.code);
    });

    socket.on("game:returnToLobby", () => {
      if (!currentPlayerId) return;
      const roomCode = playerToRoom.get(currentPlayerId);
      if (!roomCode) return;
      const room = getRoom(roomCode);
      if (!room || room.hostId !== currentPlayerId) return;
      if (room.phase !== "gameOver") return;

      clearRoundTimer(roomCode);
      clearAudioSyncTimer(roomCode);
      room.phase = "lobby";
      room.currentRound = 0;
      room.suddenDeath = false;
      room.round = undefined;
      room.roundResult = undefined;
      room.playedClips = [];
      room.usedTrackIds = [];
      room.reviewPlayback = null;
      room.showCoverBrowser = false;
      room.players.forEach((p) => {
        p.score = 0;
        p.isReady = false;
      });
      broadcastRoom(io, room);
    });

    socket.on("review:playClip", (payload: ReviewPlayPayload) => {
      if (!currentPlayerId) return;
      const roomCode = playerToRoom.get(currentPlayerId);
      if (!roomCode) return;
      const room = getRoom(roomCode);
      if (!room || room.hostId !== currentPlayerId) return;
      if (room.phase !== "roundEnd" && room.phase !== "gameOver") return;
      if (!payload?.youtubeVideoId || typeof payload.youtubeVideoId !== "string") return;

      const catalog = getAiClipById(`yt-${payload.youtubeVideoId}`);
      const now = Date.now();
      const next: ReviewPlayback = {
        youtubeVideoId: payload.youtubeVideoId,
        title: payload.title || catalog?.name || "Clip",
        artist: payload.artist || catalog?.english || "",
        aiLabel: payload.aiLabel || catalog?.aiLabel,
        artworkUrl:
          payload.artworkUrl ||
          catalog?.artworkUrl ||
          `https://img.youtube.com/vi/${payload.youtubeVideoId}/hqdefault.jpg`,
        snippetStart: Math.max(0, Math.floor(payload.snippetStart ?? 0)),
        snippetDuration: Math.max(
          1,
          Math.floor(payload.snippetDuration ?? AI_CLIP_DURATION_SEC)
        ),
        nonce: now,
        // Everyone unlocks Play at the same server time (each device still taps).
        audioPlayAt: now + REVIEW_PLAY_DELAY_MS,
      };
      room.reviewPlayback = next;
      broadcastRoom(io, room);
    });

    socket.on("review:stopClip", () => {
      if (!currentPlayerId) return;
      const roomCode = playerToRoom.get(currentPlayerId);
      if (!roomCode) return;
      const room = getRoom(roomCode);
      if (!room || room.hostId !== currentPlayerId) return;
      if (room.phase !== "roundEnd" && room.phase !== "gameOver") return;
      room.reviewPlayback = null;
      broadcastRoom(io, room);
    });

    socket.on("review:openCoverBrowser", () => {
      if (!currentPlayerId) return;
      const roomCode = playerToRoom.get(currentPlayerId);
      if (!roomCode) return;
      const room = getRoom(roomCode);
      if (!room || room.hostId !== currentPlayerId) return;
      if (room.phase !== "roundEnd" && room.phase !== "gameOver") return;
      room.showCoverBrowser = true;
      room.reviewPlayback = null;
      broadcastRoom(io, room);
    });

    socket.on("review:closeCoverBrowser", () => {
      if (!currentPlayerId) return;
      const roomCode = playerToRoom.get(currentPlayerId);
      if (!roomCode) return;
      const room = getRoom(roomCode);
      if (!room || room.hostId !== currentPlayerId) return;
      if (room.phase !== "roundEnd" && room.phase !== "gameOver") return;
      room.showCoverBrowser = false;
      room.reviewPlayback = null;
      broadcastRoom(io, room);
    });

    socket.on("room:leave", () => {
      if (!currentPlayerId) return;
      const roomCode = playerToRoom.get(currentPlayerId);
      if (!roomCode) return;
      const room = getRoom(roomCode);
      if (!room || room.phase !== "lobby") {
        socket.emit("error", { message: "You can only leave while in the lobby." });
        return;
      }

      removePlayer(io, currentPlayerId);
      socket.leave(roomCode);
      currentPlayerId = null;
      socket.emit("room:left");
    });

    socket.on("disconnect", () => {
      if (currentPlayerId) {
        removePlayer(io, currentPlayerId);
      }
    });
  });

  return io;
}

export { rooms };
