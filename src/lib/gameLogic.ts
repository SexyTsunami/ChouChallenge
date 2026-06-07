import { PLACEMENT_POINTS } from "@/types/game";
import type { Player, RoundResult, RoundState } from "@/types/game";

export function calculateRoundScores(
  round: RoundState,
  players: Player[]
): RoundResult {
  const correctIndex = round.choices.findIndex((c) => c.name === round.correctAnswer);

  const voteEntries = players
    .filter((p) => round.votes[p.id] === correctIndex)
    .sort((a, b) => (round.voteTimes[a.id] ?? Infinity) - (round.voteTimes[b.id] ?? Infinity));

  const scoresEarned: Record<string, number> = {};
  players.forEach((p) => {
    scoresEarned[p.id] = 0;
  });

  voteEntries.forEach((player, index) => {
    scoresEarned[player.id] = PLACEMENT_POINTS[index] ?? PLACEMENT_POINTS[PLACEMENT_POINTS.length - 1];
  });

  const rankings = players.map((p) => {
    const choice = round.votes[p.id] ?? null;
    const correct = choice === correctIndex;
    return {
      playerId: p.id,
      nickname: p.nickname,
      choice,
      correct,
      points: scoresEarned[p.id],
    };
  });

  rankings.sort((a, b) => b.points - a.points);

  return {
    roundNumber: round.roundNumber,
    correctAnswer: round.correctAnswer,
    correctEnglish: round.correctEnglish,
    artworkUrl: round.artworkUrl,
    choices: round.choices,
    votes: { ...round.votes },
    scoresEarned,
    rankings,
  };
}

export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
