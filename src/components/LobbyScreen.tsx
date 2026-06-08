"use client";

import type { ClientRoomView } from "@/types/game";
import {
  MAX_CHOICES,
  MAX_PLAYERS,
  MAX_ROUNDS,
  MIN_CHOICES,
  MIN_ROUNDS,
  DEFAULT_CHOICES,
  PLACEMENT_POINTS,
} from "@/types/game";

const ORDINAL_WORDS = ["First", "Second", "Third", "Fourth", "Fifth", "Sixth"];

interface LobbyScreenProps {
  room: ClientRoomView;
  playerId: string;
  onReady: (ready: boolean) => void;
  onSettings: (settings: { rounds?: number; choiceCount?: number }) => void;
  onStart: () => void;
}

export default function LobbyScreen({
  room,
  playerId,
  onReady,
  onSettings,
  onStart,
}: LobbyScreenProps) {
  const me = room.players.find((p) => p.id === playerId);
  const isHost = me?.isHost ?? false;
  const allReady = room.players.length >= 1 && room.players.every((p) => p.isReady);
  const canStart = isHost && allReady && room.players.length >= 1;
  const choiceCount = room.settings.choiceCount ?? DEFAULT_CHOICES;

  return (
    <main className="min-h-dvh px-4 py-6 max-w-lg mx-auto">
      <header className="text-center mb-8">
        <p className="text-gray-400 text-sm">Room Code</p>
        <p className="font-mono text-4xl font-bold tracking-[0.3em] text-vinyl-accent">
          {room.code}
        </p>
        <p className="text-gray-500 text-sm mt-2">
          Share this code with friends ({room.players.length}/{MAX_PLAYERS})
        </p>
      </header>

      <section className="glass rounded-2xl p-4 mb-6">
        <h2 className="font-display font-semibold mb-3">Players</h2>
        <ul className="space-y-2">
          {room.players.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between bg-vinyl-card rounded-xl px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{p.nickname}</span>
                {p.isHost && (
                  <span className="text-xs bg-vinyl-accent/20 text-vinyl-accent px-2 py-0.5 rounded-full">
                    Host
                  </span>
                )}
              </div>
              <span
                className={`text-sm ${p.isReady ? "text-vinyl-accent" : "text-gray-500"}`}
              >
                {p.isReady ? "Ready ✓" : "Not ready"}
              </span>
            </li>
          ))}
          {Array.from({ length: MAX_PLAYERS - room.players.length }).map((_, i) => (
            <li
              key={`empty-${i}`}
              className="flex items-center justify-center bg-vinyl-card/50 rounded-xl px-4 py-3 border border-dashed border-vinyl-border text-gray-600 text-sm"
            >
              Waiting for player…
            </li>
          ))}
        </ul>
      </section>

      <section className="glass rounded-2xl p-4 mb-6">
        <h2 className="font-display font-semibold mb-1">Scoring</h2>
        <p className="text-gray-500 text-xs mb-3">
          The faster you answer correctly, the more points you earn.
        </p>
        <ul className="space-y-1.5">
          {PLACEMENT_POINTS.map((points, i) => (
            <li
              key={i}
              className="flex items-center justify-between bg-vinyl-card rounded-lg px-3 py-2 text-sm"
            >
              <span className="text-gray-300">{ORDINAL_WORDS[i]} player to guess correctly</span>
              <span className="font-mono font-bold text-vinyl-accent">{points} pts</span>
            </li>
          ))}
        </ul>
      </section>

      {isHost && (
        <section className="glass rounded-2xl p-4 mb-6">
          <h2 className="font-display font-semibold mb-3">Game Settings</h2>
          <label className="block text-sm text-gray-400 mb-2">Number of rounds</label>
          <div className="flex items-center gap-4 mb-5">
            <input
              type="range"
              min={MIN_ROUNDS}
              max={MAX_ROUNDS}
              value={room.settings.rounds}
              onChange={(e) => onSettings({ rounds: parseInt(e.target.value, 10) })}
              className="flex-1 accent-vinyl-accent"
            />
            <span className="font-mono text-xl w-8 text-center">{room.settings.rounds}</span>
          </div>
          <label className="block text-sm text-gray-400 mb-2">Answer choices per round</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={MIN_CHOICES}
              max={MAX_CHOICES}
              value={choiceCount}
              onChange={(e) => onSettings({ choiceCount: parseInt(e.target.value, 10) })}
              className="flex-1 accent-vinyl-accent"
            />
            <span className="font-mono text-xl w-8 text-center">{choiceCount}</span>
          </div>
        </section>
      )}

      <div className="flex flex-col gap-3">
        <button
          className={`w-full py-3 rounded-full font-semibold transition-all active:scale-95 ${
            me?.isReady
              ? "bg-vinyl-card border border-vinyl-accent text-vinyl-accent"
              : "btn-primary"
          }`}
          onClick={() => onReady(!me?.isReady)}
        >
          {me?.isReady ? "Cancel Ready" : "Ready"}
        </button>

        {isHost && (
          <button className="btn-primary w-full" disabled={!canStart} onClick={onStart}>
            {allReady ? "Start Game" : "Waiting for everyone to ready up…"}
          </button>
        )}
      </div>
    </main>
  );
}
