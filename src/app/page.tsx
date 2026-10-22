"use client";

import { useGameSocket } from "@/hooks/useGameSocket";
import StartScreen from "@/components/StartScreen";
import LobbyScreen from "@/components/LobbyScreen";
import GameScreen from "@/components/GameScreen";
import RoundReveal from "@/components/RoundReveal";
import GameOverScreen from "@/components/GameOverScreen";
import CoverBrowserScreen from "@/components/CoverBrowserScreen";

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
    signalAudioReady,
    signalClipStarted,
    nextRound,
    signalTimerExpired,
    returnToLobby,
    playReviewClip,
    stopReviewClip,
    openCoverBrowser,
    closeCoverBrowser,
    leaveRoom,
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

  if (
    room.showCoverBrowser &&
    (room.phase === "roundEnd" || room.phase === "gameOver")
  ) {
    return (
      <CoverBrowserScreen
        room={room}
        isHost={isHost}
        onPlayClip={playReviewClip}
        onStopClip={stopReviewClip}
        onClose={closeCoverBrowser}
      />
    );
  }

  switch (room.phase) {
    case "lobby":
      return (
        <LobbyScreen
          room={room}
          playerId={playerId}
          onReady={setReady}
          onSettings={updateSettings}
          onStart={startGame}
          onLeave={leaveRoom}
        />
      );

    case "playing":
      return (
        <GameScreen
          key={room.round?.roundNumber ?? room.currentRound}
          room={room}
          playerId={playerId}
          onVote={submitVote}
          onAudioReady={signalAudioReady}
          onClipStarted={signalClipStarted}
          onTimerExpired={signalTimerExpired}
        />
      );

    case "roundEnd":
      return (
        <RoundReveal
          room={room}
          playerId={playerId}
          isHost={isHost}
          onNext={nextRound}
          onPlayClip={playReviewClip}
          onStopClip={stopReviewClip}
        />
      );

    case "gameOver":
      return (
        <GameOverScreen
          room={room}
          playerId={playerId}
          isHost={isHost}
          onReturnToLobby={returnToLobby}
          onPlayClip={playReviewClip}
          onStopClip={stopReviewClip}
          onOpenCoverBrowser={openCoverBrowser}
        />
      );

    default:
      return null;
  }
}
