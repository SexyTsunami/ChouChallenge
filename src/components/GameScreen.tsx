"use client";

import { useState } from "react";
import type { ClientRoomView } from "@/types/game";
import SnippetPlayer from "./SnippetPlayer";
import RoundTimer from "./RoundTimer";

interface GameScreenProps {
  room: ClientRoomView;
  playerId: string;
  onVote: (choiceIndex: number) => void;
}

export default function GameScreen({ room, playerId, onVote }: GameScreenProps) {
  const round = room.round!;
  const [selected, setSelected] = useState<number | null>(
    round.hasVoted ? round.myVote : null
  );
  const [locked, setLocked] = useState(round.hasVoted);

  const handleSelect = (index: number) => {
    if (locked) return;
    setSelected(index);
    setLocked(true);
    onVote(index);
  };

  return (
    <main className="min-h-dvh px-4 py-6 max-w-lg mx-auto flex flex-col gap-6">
      <header className="text-center">
        <p className="text-gray-400 text-sm">
          Round {round.roundNumber} of {room.settings.rounds}
        </p>
        <h1 className="font-display text-xl font-bold mt-1">What song is this?</h1>
      </header>

      <SnippetPlayer
        previewUrl={round.previewUrl}
        snippetStart={round.snippetStart}
        snippetDuration={round.snippetDuration}
        audioPlayAt={round.audioPlayAt}
      />

      <RoundTimer
        timerSeconds={round.timerSeconds}
        roundStartTime={round.roundStartTime}
      />

      <div className="grid grid-cols-1 gap-3 flex-1">
        {round.choices.map((choice, index) => {
          const isSelected = selected === index;
          return (
            <button
              key={`${choice.name}-${index}`}
              disabled={locked && !isSelected}
              onClick={() => handleSelect(index)}
              className={`w-full text-left px-4 py-4 rounded-xl font-medium transition-all active:scale-[0.98] min-h-[56px] ${
                isSelected
                  ? "bg-vinyl-accent text-black ring-2 ring-vinyl-accent"
                  : locked
                    ? "bg-vinyl-card/50 text-gray-500 cursor-not-allowed"
                    : "glass hover:border-vinyl-accent/50 hover:bg-vinyl-card"
              }`}
            >
              <div className="flex items-baseline">
                <span className="text-gray-500 text-xs mr-2">{index + 1}.</span>
                <div>
                  <span className="block">{choice.name}</span>
                  <span
                    className={`block text-xs ${
                      isSelected ? "text-black/60" : "text-gray-400"
                    }`}
                  >
                    {choice.english}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {locked && (
        <p className="text-center text-sm text-gray-400 animate-pulse">
          Answer locked — waiting for other players…
        </p>
      )}

      <section className="glass rounded-xl p-3">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Scoreboard</p>
        <div className="flex flex-wrap gap-2">
          {room.players
            .slice()
            .sort((a, b) => b.score - a.score)
            .map((p) => (
              <span
                key={p.id}
                className={`text-sm px-3 py-1 rounded-full ${
                  p.id === playerId ? "bg-vinyl-accent/20 text-vinyl-accent" : "bg-vinyl-card"
                }`}
              >
                {p.nickname}: {p.score}
              </span>
            ))}
        </div>
      </section>
    </main>
  );
}
