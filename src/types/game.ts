export interface Player {
  id: string;
  nickname: string;
  isHost: boolean;
  isReady: boolean;
  score: number;
  socketId: string;
}

export interface RoomSettings {
  rounds: number;
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
  choices: SongChoice[];
  previewUrl: string;
  artworkUrl: string;
  snippetStart: number;
  snippetDuration: number;
  votes: Record<string, number | null>;
  voteTimes: Record<string, number>;
  roundStartTime: number;
  timerSeconds: number;
  audioPlayAt: number;
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
  round?: Omit<RoundState, "correctAnswer" | "correctEnglish" | "votes" | "voteTimes"> & {
    hasVoted: boolean;
    myVote: number | null;
  };
  roundResult?: RoundResult;
}

export const MAX_PLAYERS = 4;
export const MIN_ROUNDS = 3;
export const MAX_ROUNDS = 15;
export const DEFAULT_ROUNDS = 5;
export const ROUND_TIMER_SECONDS = 15;
export const SNIPPET_LOOPS = 3;
export const LOOP_PAUSE_MS = 400;

/** Points by placement for correct answers (1st through 4th, fastest first) */
export const PLACEMENT_POINTS = [100, 75, 50, 25];
