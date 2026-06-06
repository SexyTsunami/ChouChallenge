"use client";

import type { ClientRoomView } from "@/types/game";

interface RoundRevealProps {
  room: ClientRoomView;
  playerId: string;
  isHost: boolean;
  onNext: () => void;
}

export default function RoundReveal({ room, playerId, isHost, onNext }: RoundRevealProps) {
  const result = room.roundResult!;
  const correctIndex = result.choices.indexOf(result.correctAnswer);
  const isLastRound = room.currentRound >= room.settings.rounds;

  return (
    <main className="min-h-dvh px-4 py-6 max-w-lg mx-auto flex flex-col gap-6">
      <header className="text-center">
        <p className="text-vinyl-accent text-sm font-medium">Round {result.roundNumber} Results</p>
        <h1 className="font-display text-2xl font-bold mt-1">{result.correctAnswer}</h1>
        <p className="text-gray-400 text-sm mt-1">was the correct answer</p>
      </header>

      <section className="glass rounded-2xl p-4 space-y-3">
        <h2 className="font-display font-semibold text-sm text-gray-400 uppercase tracking-wide">
          Everyone&apos;s picks
        </h2>
        {room.players.map((p) => {
          const ranking = result.rankings.find((r) => r.playerId === p.id);
          const choice = ranking?.choice;
          const choiceLabel =
            choice !== null && choice !== undefined ? result.choices[choice] : "No answer";
          const correct = ranking?.correct ?? false;
          const points = ranking?.points ?? 0;

          return (
            <div
              key={p.id}
              className={`flex items-center justify-between rounded-xl px-4 py-3 ${
                correct ? "bg-vinyl-accent/10 border border-vinyl-accent/30" : "bg-vinyl-card"
              }`}
            >
              <div>
                <span className="font-medium">
                  {p.nickname}
                  {p.id === playerId && " (you)"}
                </span>
                <p className="text-sm text-gray-400 truncate max-w-[200px]">{choiceLabel}</p>
              </div>
              <div className="text-right">
                {correct ? (
                  <span className="text-vinyl-accent font-bold">+{points}</span>
                ) : (
                  <span className="text-gray-500">0</span>
                )}
              </div>
            </div>
          );
        })}
      </section>

      <section className="glass rounded-2xl p-4">
        <h2 className="font-display font-semibold text-sm text-gray-400 uppercase tracking-wide mb-3">
          Scoreboard
        </h2>
        {room.players
          .slice()
          .sort((a, b) => b.score - a.score)
          .map((p, i) => (
            <div key={p.id} className="flex justify-between py-2 border-b border-vinyl-border last:border-0">
              <span>
                <span className="text-gray-500 w-6 inline-block">#{i + 1}</span>
                {p.nickname}
              </span>
              <span className="font-mono font-bold text-vinyl-accent">{p.score}</span>
            </div>
          ))}
      </section>

      {isHost ? (
        <button className="btn-primary w-full" onClick={onNext}>
          {isLastRound ? "See Final Results" : "Next Round"}
        </button>
      ) : (
        <p className="text-center text-gray-400 text-sm animate-pulse">
          Waiting for host to continue…
        </p>
      )}
    </main>
  );
}
