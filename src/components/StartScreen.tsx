"use client";

import { useState } from "react";
import VinylRecord from "./VinylRecord";

interface StartScreenProps {
  connected: boolean;
  onCreate: (nickname: string) => void;
  onJoin: (nickname: string, code: string) => void;
  error: string | null;
  onClearError: () => void;
}

export default function StartScreen({
  connected,
  onCreate,
  onJoin,
  error,
  onClearError,
}: StartScreenProps) {
  const [nickname, setNickname] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [mode, setMode] = useState<"menu" | "join">("menu");

  const canAct = connected && nickname.trim().length >= 1;

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--vinyl-glow)_0%,_transparent_50%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-8">
        <VinylRecord />

        <header className="text-center">
          <p className="text-vinyl-accent text-sm font-medium tracking-widest uppercase mb-2">
            Multiplayer Trivia
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight">
            Jay Chou
            <br />
            <span className="text-vinyl-accent">Guess the Intro</span>
          </h1>
          <p className="text-gray-400 mt-3 text-sm">
            Up to 4 friends · Song previews · Speed scoring
          </p>
        </header>

        {!connected && (
          <p className="text-amber-400 text-sm animate-pulse">Connecting to server…</p>
        )}

        {error && (
          <div className="w-full glass rounded-xl p-3 text-red-400 text-sm flex justify-between items-center">
            <span>{error}</span>
            <button onClick={onClearError} className="text-gray-400 hover:text-white ml-2">
              ✕
            </button>
          </div>
        )}

        <div className="w-full space-y-4">
          <input
            type="text"
            placeholder="Your nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value.slice(0, 20))}
            className="input-field"
            maxLength={20}
          />

          {mode === "menu" ? (
            <div className="flex flex-col gap-3">
              <button
                className="btn-primary w-full"
                disabled={!canAct}
                onClick={() => onCreate(nickname.trim())}
              >
                Create Lobby
              </button>
              <button
                className="btn-secondary w-full"
                disabled={!canAct}
                onClick={() => setMode("join")}
              >
                Join Lobby
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Room code (e.g. AB12CD)"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                className="input-field font-mono tracking-widest text-center text-lg"
                maxLength={6}
              />
              <button
                className="btn-primary w-full"
                disabled={!canAct || roomCode.length < 4}
                onClick={() => onJoin(nickname.trim(), roomCode)}
              >
                Join Room
              </button>
              <button className="btn-secondary w-full" onClick={() => setMode("menu")}>
                Back
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
