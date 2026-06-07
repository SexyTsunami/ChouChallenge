"use client";

import { useEffect } from "react";
import Image from "next/image";
import type { ClientRoomView } from "@/types/game";

interface RoundRevealProps {
  room: ClientRoomView;
  playerId: string;
  isHost: boolean;
  onNext: () => void;
}

function playSuccessChime() {
  try {
    const AudioCtx =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.13;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
      osc.start(t);
      osc.stop(t + 0.9);
    });
  } catch {
    // AudioContext may be unavailable in some environments
  }
}

export default function RoundReveal({ room, playerId, isHost, onNext }: RoundRevealProps) {
  const result = room.roundResult!;
  const isLastRound = room.currentRound >= room.settings.rounds;
  const myRanking = result.rankings.find((r) => r.playerId === playerId);
  const iGotItRight = myRanking?.correct ?? false;

  useEffect(() => {
    if (iGotItRight) {
      playSuccessChime();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.roundNumber]);

  return (
    <main className="min-h-dvh px-4 py-6 max-w-lg mx-auto flex flex-col gap-5">
      <header className="text-center">
        <p className="text-vinyl-accent text-sm font-medium tracking-wide">
          Round {result.roundNumber} Results
        </p>
      </header>

      <div className="flex flex-col items-center gap-3">
        {result.artworkUrl ? (
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden shadow-2xl ring-2 ring-vinyl-border">
            <Image
              src={result.artworkUrl}
              alt={result.correctAnswer}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="w-48 h-48 rounded-2xl bg-vinyl-card flex items-center justify-center">
            <span className="text-4xl">🎵</span>
          </div>
        )}
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold">{result.correctAnswer}</h1>
          <p className="text-vinyl-accent text-sm mt-1">{result.correctEnglish}</p>
          <p className="text-gray-400 text-sm mt-1">was the correct answer</p>
        </div>

        {myRanking && (
          <div
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              iGotItRight
                ? "bg-vinyl-accent/20 text-vinyl-accent border border-vinyl-accent/40"
                : "bg-vinyl-card text-gray-400"
            }`}
          >
            {iGotItRight ? `✓ Correct! +${myRanking.points}` : "✗ Incorrect"}
          </div>
        )}
      </div>

      <section className="glass rounded-2xl p-4 space-y-2">
        <h2 className="font-display font-semibold text-sm text-gray-400 uppercase tracking-wide mb-3">
          Everyone&apos;s picks
        </h2>
        {room.players.map((p) => {
          const ranking = result.rankings.find((r) => r.playerId === p.id);
          const choiceIdx = ranking?.choice;
          const picked =
            choiceIdx !== null && choiceIdx !== undefined ? result.choices[choiceIdx] : null;
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
                {picked ? (
                  <p className="text-sm text-gray-400 truncate max-w-[220px]">
                    {picked.name}
                    <span className="text-gray-500"> · {picked.english}</span>
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">No answer</p>
                )}
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
            <div
              key={p.id}
              className="flex justify-between py-2 border-b border-vinyl-border last:border-0"
            >
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
