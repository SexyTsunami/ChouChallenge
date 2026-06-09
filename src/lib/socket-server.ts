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
import { getTracksForMode } from "./tracks";
import type {
  ClientRoomView,
  Player,
  RoomSettings,
  RoomState,
  TrackInfo,
} from "@/types/game";
import {
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
  ROUND_TIMER_SECONDS,
} from "@/types/game";

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
    tracks: room.tracks.map(({ id, name, english }) => ({ id, name, english })),
    roundResult: room.roundResult,
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
  room.round.audioPlayAt = now + AUDIO_PLAY_DELAY_MS;
  room.round.roundStartTime = now;

  clearRoundTimer(room.code);
  const timer = setTimeout(() => {
    endRound(io, room.code);
  }, ROUND_TIMER_SECONDS * 1000 + AUDIO_PLAY_DELAY_MS);
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

async function endRound(io: Server, code: string) {
  const room = getRoom(code);
  if (!room || !room.round || room.phase !== "playing") return;

  clearRoundTimer(code);
  clearAudioSyncTimer(code);

  const result = calculateRoundScores(room.round, room.players);
  room.roundResult = result;

  room.players.forEach((p) => {
    p.score += result.scoresEarned[p.id] ?? 0;
  });

  room.phase = "roundEnd";
  room.round = undefined;
  broadcastRoom(io, room);
}

async function startNextRound(io: Server, code: string) {
  const room = getRoom(code);
  if (!room) return;

  const gameMode = room.settings.gameMode ?? DEFAULT_GAME_MODE;
  const tracks = getTracksForMode(gameMode);
  room.tracks = tracks;

  const choiceCount = room.settings.choiceCount ?? DEFAULT_CHOICES;

  if (tracks.length < choiceCount) {
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
  const audioReady: Record<string, boolean> = {};
  room.players.forEach((p) => {
    audioReady[p.id] = false;
  });

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
  };

  room.phase = "playing";
  room.roundResult = undefined;
  broadcastRoom(io, room);

  clearRoundTimer(code);
  clearAudioSyncTimer(code);
  const syncTimer = setTimeout(() => {
    const r = getRoom(code);
    if (r) beginRoundAudio(io, r);
  }, AUDIO_SYNC_MAX_WAIT_MS);
  audioSyncTimers.set(code, syncTimer);
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
        tracks,
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
      ({
        rounds,
        choiceCount,
        gameMode,
      }: {
        rounds?: number;
        choiceCount?: number;
        gameMode?: GameMode;
      }) => {
        if (!currentPlayerId) return;
        const roomCode = playerToRoom.get(currentPlayerId);
        if (!roomCode) return;
        const room = getRoom(roomCode);
        if (!room || room.hostId !== currentPlayerId) return;

        if (rounds !== undefined) {
          room.settings.rounds = Math.min(MAX_ROUNDS, Math.max(MIN_ROUNDS, rounds));
        }
        if (choiceCount !== undefined) {
          room.settings.choiceCount = Math.min(
            MAX_CHOICES,
            Math.max(MIN_CHOICES, choiceCount)
          );
        }
        if (gameMode !== undefined && (gameMode === "jayChou" || gameMode === "tienFamily")) {
          room.settings.gameMode = gameMode;
          room.tracks = getTracksForMode(gameMode);
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

      room.players.forEach((p) => {
        p.score = 0;
        p.isReady = false;
      });
      room.currentRound = 0;
      room.suddenDeath = false;
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

    socket.on("game:vote", ({ choiceIndex }: { choiceIndex: number }) => {
      if (!currentPlayerId) return;
      const roomCode = playerToRoom.get(currentPlayerId);
      if (!roomCode) return;
      const room = getRoom(roomCode);
      if (!room || !room.round || room.phase !== "playing") return;

      if (room.round.votes[currentPlayerId] !== undefined) return;

      room.round.votes[currentPlayerId] = choiceIndex;
      room.round.voteTimes[currentPlayerId] = Date.now();

      room.players.forEach((p) => {
        io.to(p.socketId).emit("room:update", toClientView(room, p.id));
      });

      if (allPlayersVoted(room)) {
        endRound(io, room.code);
      }
    });

    socket.on("game:nextRound", async () => {
      if (!currentPlayerId) return;
      const roomCode = playerToRoom.get(currentPlayerId);
      if (!roomCode) return;
      const room = getRoom(roomCode);
      if (!room || room.hostId !== currentPlayerId) return;
      if (room.phase !== "roundEnd") return;

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

      clearRoundTimer(roomCode);
      clearAudioSyncTimer(roomCode);
      room.phase = "lobby";
      room.currentRound = 0;
      room.suddenDeath = false;
      room.round = undefined;
      room.roundResult = undefined;
      room.players.forEach((p) => {
        p.score = 0;
        p.isReady = false;
      });
      broadcastRoom(io, room);
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
