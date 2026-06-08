"use client";

import type { ClientRoomView } from "@/types/game";
import {
  DEFAULT_CHOICES,
  DEFAULT_GAME_MODE,
  MAX_CHOICES,
  MAX_PLAYERS,
  MAX_ROUNDS,
  MIN_CHOICES,
  MIN_ROUNDS,
  PLACEMENT_POINTS,
} from "@/types/game";
import { unlockAudioSession } from "@/lib/audioUnlock";
import { getGameModeLabel } from "@/lib/tracks";

const ORDINAL_WORDS = ["First", "Second", "Third", "Fourth", "Fifth", "Sixth"];

interface LobbyScreenProps {
  room: ClientRoomView;
  playerId: string;
  onReady: (ready: boolean) => void;
  onSettings: (settings: {
    rounds?: number;
    choiceCount?: number;
    gameMode?: "jayChou" | "tienFamily";
  }) => void;
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
  const gameMode = room.settings.gameMode ?? DEFAULT_GAME_MODE;
  const isTienFamily = gameMode === "tienFamily";

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
        <p className="text-vinyl-accent/90 text-xs mt-3 font-medium">
          {getGameModeLabel(gameMode)}
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
          <div className="mt-5 pt-5 border-t border-vinyl-border">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium leading-snug">
                  Tien Family Favorites Challenge
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {isTienFamily
                    ? "Portland2023 playlist · 30 family favorites"
                    : "Jay Chou discography (default)"}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isTienFamily}
                aria-label="Tien Family Favorites Challenge"
                onClick={() =>
                  onSettings({ gameMode: isTienFamily ? "jayChou" : "tienFamily" })
                }
                className={`relative shrink-0 w-12 h-7 rounded-full transition-colors ${
                  isTienFamily ? "bg-vinyl-accent" : "bg-vinyl-card border border-vinyl-border"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                    isTienFamily ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
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
          onClick={() => {
            void unlockAudioSession();
            onReady(!me?.isReady);
          }}
        >
          {me?.isReady ? "Cancel Ready" : "Ready"}
        </button>

        {isHost && (
          <button
            className="btn-primary w-full"
            disabled={!canStart}
            onClick={() => {
              void unlockAudioSession();
              onStart();
            }}
          >
            {allReady ? "Start Game" : "Waiting for everyone to ready up…"}
          </button>
        )}
      </div>
    </main>
  );
}
