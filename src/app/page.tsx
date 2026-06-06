"use client";

import { useGameSocket } from "@/hooks/useGameSocket";
import StartScreen from "@/components/StartScreen";
import LobbyScreen from "@/components/LobbyScreen";
import GameScreen from "@/components/GameScreen";
import RoundReveal from "@/components/RoundReveal";
import GameOverScreen from "@/components/GameOverScreen";

export default function HomePage() {
  const {
    connected,
    playerId,
    room,
    error,
    clearError,
    createRoom,
    joinRoom,
    setReady,
    updateSettings,
    startGame,
    submitVote,
    nextRound,
    returnToLobby,
  } = useGameSocket();

  if (!room || !playerId) {
    return (
      <StartScreen
        connected={connected}
        onCreate={createRoom}
        onJoin={joinRoom}
        error={error}
        onClearError={clearError}
      />
    );
  }

  const me = room.players.find((p) => p.id === playerId);
  const isHost = me?.isHost ?? false;

  switch (room.phase) {
    case "lobby":
      return (
        <LobbyScreen
          room={room}
          playerId={playerId}
          onReady={setReady}
          onSettings={updateSettings}
          onStart={startGame}
        />
      );

    case "playing":
      return (
        <GameScreen
          key={room.round?.roundNumber ?? room.currentRound}
          room={room}
          playerId={playerId}
          onVote={submitVote}
        />
      );

    case "roundEnd":
      return (
        <RoundReveal
          room={room}
          playerId={playerId}
          isHost={isHost}
          onNext={nextRound}
        />
      );

    case "gameOver":
      return (
        <GameOverScreen
          room={room}
          playerId={playerId}
          isHost={isHost}
          onReturnToLobby={returnToLobby}
        />
      );

    default:
      return null;
  }
}
