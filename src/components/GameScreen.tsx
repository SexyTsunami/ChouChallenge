"use client";

import { useState } from "react";
import type { ClientRoomView } from "@/types/game";
import { DEFAULT_GAME_MODE } from "@/types/game";
import { getSuddenDeathRoundNumber } from "@/lib/gameLogic";
import SnippetPlayer from "./SnippetPlayer";
import YouTubeClipPlayer from "./YouTubeClipPlayer";
import RoundTimer from "./RoundTimer";

interface GameScreenProps {
  room: ClientRoomView;
  playerId: string;
  onVote: (choiceIndex: number) => void;
  onAudioReady: () => void;
  onClipStarted?: () => void;
  onTimerExpired?: () => void;
}

export default function GameScreen({
  room,
  playerId,
  onVote,
  onAudioReady,
  onClipStarted,
  onTimerExpired,
}: GameScreenProps) {
  const round = room.round!;
  const gameMode = room.settings.gameMode ?? DEFAULT_GAME_MODE;
  const isAiMode = gameMode === "isThisAi" || round.mediaType === "youtube";
  const isPlaylistMode = gameMode !== "jayChou" && !isAiMode;
  const inSuddenDeath =
    room.suddenDeath && room.currentRound > room.settings.rounds;
  const suddenDeathRound = getSuddenDeathRoundNumber(
    room.currentRound,
    room.settings.rounds
  );
  const [selected, setSelected] = useState<number | null>(
    round.hasVoted ? round.myVote : null
  );
  const [locked, setLocked] = useState(round.hasVoted);

  const handleSelect = (index: number) => {
    if (locked || round.audioSyncing) return;
    setSelected(index);
    setLocked(true);
    onVote(index);
  };

  return (
    <main className="h-dvh overflow-hidden px-4 py-3 max-w-lg mx-auto flex flex-col gap-3">
      <header className="text-center shrink-0">
        {inSuddenDeath ? (
          <>
            <p className="text-red-400 text-xs font-bold tracking-widest uppercase animate-pulse">
              Sudden Death
            </p>
            <p className="text-gray-400 text-xs mt-1">Tiebreaker round {suddenDeathRound}</p>
          </>
        ) : (
          <p className="text-gray-400 text-xs">
            Round {round.roundNumber} of {room.settings.rounds}
          </p>
        )}
        <h1 className="font-display text-lg font-bold leading-tight">
          {isAiMode
            ? "Is this AI or human?"
            : isPlaylistMode
              ? "What song is this?"
              : "What Jay Chou song is this?"}
        </h1>
      </header>

      <div className="shrink-0">
        {isAiMode && round.youtubeVideoId ? (
          <YouTubeClipPlayer
            youtubeVideoId={round.youtubeVideoId}
            snippetStart={round.snippetStart}
            snippetDuration={round.snippetDuration}
            syncReadyCount={round.syncReadyCount}
            syncTotalPlayers={round.syncTotalPlayers}
            onAudioReady={onAudioReady}
            onClipStarted={onClipStarted}
          />
        ) : (
          <SnippetPlayer
            previewUrl={round.previewUrl}
            snippetStart={round.snippetStart}
            snippetDuration={round.snippetDuration}
            roundStartTime={round.roundStartTime}
            audioPlayAt={round.audioPlayAt}
            audioSyncing={round.audioSyncing}
            syncReadyCount={round.syncReadyCount}
            syncTotalPlayers={round.syncTotalPlayers}
            onAudioReady={onAudioReady}
          />
        )}
      </div>

      <div className="shrink-0">
        <RoundTimer
          timerSeconds={round.timerSeconds}
          roundStartTime={round.roundStartTime}
          onExpire={onTimerExpired}
        />
      </div>

      <div
        className={`grid grid-cols-2 gap-2 ${isAiMode ? "shrink-0" : "flex-1 min-h-0"}`}
        style={
          isAiMode
            ? undefined
            : {
                gridTemplateRows: `repeat(${Math.ceil(round.choices.length / 2)}, minmax(0, 1fr))`,
              }
        }
      >
        {round.choices.map((choice, index) => {
          const isSelected = selected === index;
          return (
            <button
              key={`${choice.name}-${index}`}
              disabled={(locked && !isSelected) || round.audioSyncing}
              onClick={() => handleSelect(index)}
              className={`${
                isAiMode ? "min-h-24 py-4" : "h-full min-h-0 py-2"
              } w-full text-left px-3 rounded-xl font-medium transition-colors flex flex-col justify-center overflow-hidden border-2 box-border touch-manipulation ${
                isSelected
                  ? "bg-vinyl-accent text-black border-vinyl-accent"
                  : locked
                    ? "bg-vinyl-card/50 text-gray-500 cursor-not-allowed border-vinyl-border/30"
                    : "bg-vinyl-surface/80 border-vinyl-border hover:border-vinyl-accent/50 hover:bg-vinyl-card"
              }`}
            >
              <span
                className={`block font-semibold leading-tight truncate ${
                  isAiMode ? "text-xl text-center w-full" : "text-sm"
                }`}
              >
                {choice.name}
              </span>
              <span
                className={`block text-[11px] leading-tight truncate ${
                  isAiMode ? "text-center w-full" : ""
                } ${isSelected ? "text-black/60" : "text-gray-400"}`}
              >
                {choice.english}
              </span>
            </button>
          );
        })}
      </div>

      <div className="shrink-0 h-10 flex items-center justify-center px-2">
        <p
          className={`text-center text-xs leading-snug ${
            locked ? "text-vinyl-accent animate-pulse" : "text-gray-500"
          }`}
        >
          {locked
            ? "Answer locked — waiting for other players…"
            : "Tap your answer"}
        </p>
      </div>

      <section className="shrink-0 min-h-8 flex flex-wrap justify-center items-center gap-1.5">
        {room.players
          .slice()
          .sort((a, b) => b.score - a.score)
          .map((p) => (
            <span
              key={p.id}
              className={`text-xs px-2.5 py-1 rounded-full ${
                p.id === playerId ? "bg-vinyl-accent/20 text-vinyl-accent" : "bg-vinyl-card"
              }`}
            >
              {p.nickname}: {p.score}
            </span>
          ))}
      </section>
    </main>
  );
}
