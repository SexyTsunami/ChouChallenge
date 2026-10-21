export interface Player {
  id: string;
  nickname: string;
  isHost: boolean;
  isReady: boolean;
  score: number;
  socketId: string;
}

export type GameMode =
  | "jayChou"
  | "tienFamily"
  | "dantonFavorites"
  | "custom"
  | "isThisAi";

export type PlaylistImportStatus = "idle" | "loading" | "ready" | "error";

export interface RoomSettings {
  rounds: number;
  /** Number of multiple-choice options per round (4–8). Ignored in Is This AI? mode. */
  choiceCount: number;
  /** Song catalog / special game (one at a time). */
  gameMode: GameMode;
  /** Pasted Spotify/YouTube playlist URL when gameMode is custom. */
  customPlaylistUrl?: string;
  /** Display title from the imported playlist. */
  customPlaylistTitle?: string;
}

export interface TrackInfo {
  id: string;
  /** Chinese title / primary song title */
  name: string;
  /** English title / artist subtitle */
  english: string;
  /** Optional pre-resolved preview (e.g. Spotify embed). */
  previewUrl?: string;
  /** Optional artwork for pre-resolved previews. */
  artworkUrl?: string;
  /** YouTube video id for Is This AI? mode. */
  youtubeVideoId?: string;
  /** AI vs Human label for Is This AI? mode. */
  aiLabel?: "AI" | "Human";
  /** Preferred clip start in seconds (e.g. where vocals begin). */
  snippetStart?: number;
}

export interface SongChoice {
  /** Chinese title */
  name: string;
  /** English title */
  english: string;
}

export interface RoundState {
  roundNumber: number;
  trackId: string;
  correctAnswer: string;
  correctEnglish: string;
  /** Index into `choices` for the correct answer — authoritative for scoring. */
  correctChoiceIndex: number;
  choices: SongChoice[];
  previewUrl: string;
  artworkUrl: string;
  snippetStart: number;
  snippetDuration: number;
  votes: Record<string, number | null>;
  voteTimes: Record<string, number>;
  roundStartTime: number;
  timerSeconds: number;
  /** 0 while clients preload; set when all players are ready. */
  audioPlayAt: number;
  /** Server-only: which players have finished preloading audio. */
  audioReady: Record<string, boolean>;
  /** youtube = Is This AI? embedded clip; preview = iTunes/Spotify audio. */
  mediaType: "preview" | "youtube";
  youtubeVideoId?: string;
}

export interface RoundResult {
  roundNumber: number;
  correctAnswer: string;
  correctEnglish: string;
  artworkUrl: string;
  previewUrl: string;
  /** Where the reveal-screen background loop should start (continues from the snippet). */
  revealStart: number;
  choices: SongChoice[];
  votes: Record<string, number | null>;
  scoresEarned: Record<string, number>;
  rankings: {
    playerId: string;
    nickname: string;
    choice: number | null;
    correct: boolean;
    points: number;
  }[];
  mediaType: "preview" | "youtube";
  youtubeVideoId?: string;
  /** Song title shown on Is This AI? reveal (separate from AI/Human answer). */
  songTitle?: string;
  songArtist?: string;
  aiLabel?: "AI" | "Human";
}

/** Clip history for Is This AI? game-over playlist. */
export interface PlayedClip {
  roundNumber: number;
  aiLabel: "AI" | "Human";
  title: string;
  artist: string;
  youtubeVideoId: string;
  youtubeUrl: string;
  artworkUrl: string;
  snippetStart: number;
  snippetDuration: number;
}

/** Host-driven synced YouTube clip on reveal / cover browser. */
export interface ReviewPlayback {
  youtubeVideoId: string;
  title: string;
  artist: string;
  aiLabel?: "AI" | "Human";
  artworkUrl?: string;
  snippetStart: number;
  snippetDuration: number;
  /** Bumps when host (re)starts a clip so clients remount the embed. */
  nonce: number;
  /**
   * Server time when every device should unlock Play.
   * Each client must tap Play themselves (mobile autoplay policy) —
   * unlocking at the same moment keeps the group roughly in sync.
   */
  audioPlayAt: number;
}

export type RoomPhase = "lobby" | "playing" | "roundEnd" | "gameOver";

export interface RoomState {
  code: string;
  hostId: string;
  players: Player[];
  settings: RoomSettings;
  phase: RoomPhase;
  currentRound: number;
  /** Extra tiebreaker rounds until one player leads. */
  suddenDeath: boolean;
  /** Status of custom playlist import for lobby UI. */
  playlistStatus: PlaylistImportStatus;
  playlistError?: string;
  round?: RoundState;
  roundResult?: RoundResult;
  tracks: TrackInfo[];
  /** Clips played this game (Is This AI?), in presentation order. */
  playedClips: PlayedClip[];
  /** Track ids already used this game (avoid repeats). */
  usedTrackIds: string[];
  /** Host-selected clip currently playing for the whole room. */
  reviewPlayback?: ReviewPlayback | null;
  /** Host opened the full cover catalog for everyone. */
  showCoverBrowser?: boolean;
}

export interface ClientRoomView extends Omit<RoomState, "round" | "players"> {
  players: Omit<Player, "socketId">[];
  round?: Omit<
    RoundState,
    "correctAnswer" | "correctEnglish" | "correctChoiceIndex" | "votes" | "voteTimes" | "audioReady"
  > & {
    hasVoted: boolean;
    myVote: number | null;
    audioSyncing: boolean;
    syncReadyCount: number;
    syncTotalPlayers: number;
  };
  roundResult?: RoundResult;
}

export const MAX_PLAYERS = 4;
export const MIN_ROUNDS = 3;
export const MAX_ROUNDS = 15;
export const DEFAULT_ROUNDS = 5;
export const MIN_CHOICES = 4;
export const MAX_CHOICES = 8;
export const DEFAULT_CHOICES = 8;
export const DEFAULT_GAME_MODE: GameMode = "jayChou";
export const ROUND_TIMER_SECONDS = 15;
export const AI_CLIP_DURATION_SEC = 30;
export const AI_ROUND_TIMER_SECONDS = 35;
export const SNIPPET_LOOPS = 3;
export const LOOP_PAUSE_MS = 400;
/** Max wait for all players to preload audio before starting anyway */
export const AUDIO_SYNC_MAX_WAIT_MS = 12000;
/** Brief pause after sync before Play appears (lets the room update). */
export const AUDIO_PLAY_DELAY_MS = 1200;
/** Kept for reviewPlayback.audioPlayAt; Play is available immediately on clients. */
export const REVIEW_PLAY_DELAY_MS = 500;

/** Points by placement for correct answers (1st through 4th, fastest first) */
export const PLACEMENT_POINTS = [100, 75, 50, 25];
