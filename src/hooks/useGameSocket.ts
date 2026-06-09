"use client";

import { io, Socket } from "socket.io-client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ClientRoomView } from "@/types/game";

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    socket = io({
      path: "/api/socket",
      autoConnect: true,
    });
  }
  return socket;
}

export function useGameSocket() {
  const [connected, setConnected] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [room, setRoom] = useState<ClientRoomView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const s = getSocket();
    socketRef.current = s;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onJoined = ({ playerId: id, room: r }: { playerId: string; room: ClientRoomView }) => {
      setPlayerId(id);
      setRoom(r);
      setError(null);
    };
    const onUpdate = (r: ClientRoomView) => setRoom(r);
    const onError = ({ message }: { message: string }) => setError(message);
    const onLeft = () => {
      setPlayerId(null);
      setRoom(null);
      setError(null);
    };

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("room:joined", onJoined);
    s.on("room:update", onUpdate);
    s.on("room:left", onLeft);
    s.on("error", onError);

    if (s.connected) setConnected(true);

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("room:joined", onJoined);
      s.off("room:update", onUpdate);
      s.off("room:left", onLeft);
      s.off("error", onError);
    };
  }, []);

  const createRoom = useCallback((nickname: string) => {
    socketRef.current?.emit("room:create", { nickname });
  }, []);

  const joinRoom = useCallback((nickname: string, code: string) => {
    socketRef.current?.emit("room:join", { nickname, code: code.toUpperCase() });
  }, []);

  const setReady = useCallback((isReady: boolean) => {
    socketRef.current?.emit("room:ready", { isReady });
  }, []);

  const updateSettings = useCallback(
    (settings: {
      rounds?: number;
      choiceCount?: number;
      gameMode?: "jayChou" | "tienFamily" | "dantonFavorites";
    }) => {
      socketRef.current?.emit("room:settings", settings);
    },
    []
  );

  const startGame = useCallback(() => {
    socketRef.current?.emit("game:start");
  }, []);

  const submitVote = useCallback((choiceIndex: number) => {
    socketRef.current?.emit("game:vote", { choiceIndex });
  }, []);

  const signalAudioReady = useCallback(() => {
    socketRef.current?.emit("game:audioReady");
  }, []);

  const nextRound = useCallback(() => {
    socketRef.current?.emit("game:nextRound");
  }, []);

  const returnToLobby = useCallback(() => {
    socketRef.current?.emit("game:returnToLobby");
  }, []);

  const leaveRoom = useCallback(() => {
    socketRef.current?.emit("room:leave");
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
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
    nextRound,
    returnToLobby,
    leaveRoom,
  };
}
