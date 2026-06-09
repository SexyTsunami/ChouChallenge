"use client";

import type { ClientRoomView } from "@/types/game";
import VinylRecord from "./VinylRecord";

interface GameOverScreenProps {
  room: ClientRoomView;
  playerId: string;
  isHost: boolean;
  onReturnToLobby: () => void;
}

const PODIUM_COLORS = ["text-vinyl-gold", "text-vinyl-silver", "text-vinyl-bronze"];
const PODIUM_LABELS = ["🥇 1st", "🥈 2nd", "🥉 3rd"];

export default function GameOverScreen({
  room,
  playerId,
  isHost,
  onReturnToLobby,
}: GameOverScreenProps) {
  const sorted = room.players.slice().sort((a, b) => b.score - a.score);
  const winner = sorted[0];

  return (
    <main className="min-h-dvh px-4 py-8 max-w-lg mx-auto flex flex-col items-center gap-8">
      <VinylRecord spinning={false} />

      <header className="text-center">
        <p className="text-vinyl-accent text-sm font-medium tracking-widest uppercase">
          Game Over
        </p>
        <h1 className="font-display text-3xl font-bold mt-2">
          {winner?.nickname} wins!
        </h1>
        <p className="text-gray-400 mt-1">{winner?.score} points</p>
      </header>

      <section className="w-full glass rounded-2xl p-6">
        <h2 className="font-display font-semibold text-center mb-6">Podium</h2>
        <div className="space-y-4">
          {sorted.slice(0, 3).map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center justify-between py-3 ${
                i < 3 ? "border-b border-vinyl-border last:border-0" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-lg font-bold ${PODIUM_COLORS[i] ?? "text-gray-400"}`}>
                  {PODIUM_LABELS[i] ?? `#${i + 1}`}
                </span>
                <span className="font-medium">
                  {p.nickname}
                  {p.id === playerId && " (you)"}
                </span>
              </div>
              <span className="font-mono font-bold">{p.score}</span>
            </div>
          ))}
          {sorted.length > 3 &&
            sorted.slice(3).map((p, i) => (
              <div key={p.id} className="flex justify-between text-gray-400 text-sm py-1">
                <span>
                  #{i + 4} {p.nickname}
                </span>
                <span>{p.score}</span>
              </div>
            ))}
        </div>
      </section>

      {isHost ? (
        <button className="btn-primary w-full" onClick={onReturnToLobby}>
          Return to Lobby
        </button>
      ) : (
        <p className="text-gray-400 text-sm text-center animate-pulse">
          Waiting for host to return to lobby…
          <span className="block text-xs text-gray-500 mt-1">
            Same room code — everyone can ready up and play again.
          </span>
        </p>
      )}

      <a href="https://allantien.com" className="apple-back-button">
        ← Back to Portfolio
      </a>
    </main>
  );
}
