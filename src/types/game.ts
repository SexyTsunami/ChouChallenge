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
  name: string;
  youtubeVideoId?: string | null;
}

export interface RoundState {
  roundNumber: number;
  trackId: string;
  correctAnswer: string;
  choices: string[];
  audioUrl: string;
  youtubeVideoId: string;
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
  choices: string[];
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

export interface ClientRoomView extends Omit<RoomState, "round"> {
  round?: Omit<RoundState, "correctAnswer" | "votes"> & {
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

/** Points by placement for correct answers (1st through 4th) */
export const PLACEMENT_POINTS = [1000, 750, 500, 250];
