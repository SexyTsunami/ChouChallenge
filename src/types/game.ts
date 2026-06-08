export interface Player {
  id: string;
  nickname: string;
  isHost: boolean;
  isReady: boolean;
  score: number;
  socketId: string;
}

export type GameMode = "jayChou" | "tienFamily";

export interface RoomSettings {
  rounds: number;
  /** Number of multiple-choice options per round (4–8). */
  choiceCount: number;
  /** Song catalog — Jay Chou discography or Tien family playlist. */
  gameMode: GameMode;
}

export interface TrackInfo {
  id: string;
  /** Chinese title */
  name: string;
  /** English title */
  english: string;
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
  rankings: { playerId: string; nickname: string; choice: number | null; correct: boolean; points: number }[];
}

export type RoomPhase = "lobby" | "playing" | "roundEnd" | "gameOver";

export interface RoomState {
  code: string;
  hostId: string;
  players: Player[];
  settings: RoomSettings;
  phase: RoomPhase;
  currentRound: number;
  round?: RoundState;
  roundResult?: RoundResult;
  tracks: TrackInfo[];
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
export const SNIPPET_LOOPS = 3;
export const LOOP_PAUSE_MS = 400;
/** Max wait for all players to preload audio before starting anyway */
export const AUDIO_SYNC_MAX_WAIT_MS = 12000;
/** Countdown after sync before the first snippet plays */
export const AUDIO_PLAY_DELAY_MS = 2000;

/** Points by placement for correct answers (1st through 4th, fastest first) */
export const PLACEMENT_POINTS = [100, 75, 50, 25];
