"use client";

import { useEffect, useState } from "react";
import type { ClientRoomView, GameMode } from "@/types/game";
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
import { primeAudioInUserGesture } from "@/lib/gameAudio";
import { getGameModeLabel } from "@/lib/tracks";

const ORDINAL_WORDS = ["First", "Second", "Third", "Fourth", "Fifth", "Sixth"];

type SettingsPatch = {
  rounds?: number;
  choiceCount?: number;
  gameMode?: GameMode;
  playlistUrl?: string;
  clearCustomPlaylist?: boolean;
};

interface LobbyScreenProps {
  room: ClientRoomView;
  playerId: string;
  onReady: (ready: boolean) => void;
  onSettings: (settings: SettingsPatch) => void;
  onStart: () => void;
  onLeave: () => void;
}

export default function LobbyScreen({
  room,
  playerId,
  onReady,
  onSettings,
  onStart,
  onLeave,
}: LobbyScreenProps) {
  const me = room.players.find((p) => p.id === playerId);
  const isHost = me?.isHost ?? false;
  const allReady = room.players.length >= 1 && room.players.every((p) => p.isReady);
  const choiceCount = room.settings.choiceCount ?? DEFAULT_CHOICES;
  const gameMode = room.settings.gameMode ?? DEFAULT_GAME_MODE;
  const isTienFamily = gameMode === "tienFamily";
  const isDanton = gameMode === "dantonFavorites";
  const isCustom = gameMode === "custom";
  const playlistStatus = room.playlistStatus ?? "idle";
  const playlistReady = isCustom && playlistStatus === "ready" && room.tracks.length > 0;
  const playlistLoading = isCustom && playlistStatus === "loading";

  const [playlistDraft, setPlaylistDraft] = useState(
    room.settings.customPlaylistUrl ?? ""
  );

  useEffect(() => {
    setPlaylistDraft(room.settings.customPlaylistUrl ?? "");
  }, [room.settings.customPlaylistUrl]);

  const canStart =
    isHost &&
    allReady &&
    room.players.length >= 1 &&
    !playlistLoading &&
    (!isCustom || playlistReady);

  const selectBuiltInMode = (mode: "jayChou" | "tienFamily" | "dantonFavorites") => {
    setPlaylistDraft("");
    onSettings({ gameMode: mode });
  };

  const loadPlaylist = () => {
    const url = playlistDraft.trim();
    if (!url) {
      onSettings({ clearCustomPlaylist: true });
      return;
    }
    onSettings({ playlistUrl: url });
  };

  const clearPlaylist = () => {
    setPlaylistDraft("");
    onSettings({ clearCustomPlaylist: true });
  };

  return (
    <main className="min-h-dvh px-4 py-6 max-w-lg mx-auto relative">
      <button
        type="button"
        onClick={onLeave}
        className="apple-back-button absolute top-5 left-4 z-20"
      >
        ← Back
      </button>

      <header className="text-center mb-8 pt-10">
        <p className="text-gray-400 text-sm">Room Code</p>
        <p className="font-mono text-4xl font-bold tracking-[0.3em] text-vinyl-accent">
          {room.code}
        </p>
        <p className="text-gray-500 text-sm mt-2">
          Share this code with friends ({room.players.length}/{MAX_PLAYERS})
        </p>
        <p className="text-vinyl-accent/90 text-xs mt-3 font-medium">
          {getGameModeLabel(gameMode, room.settings.customPlaylistTitle)}
          {playlistReady ? ` · ${room.tracks.length} songs` : ""}
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

      {isHost && (
        <section className="glass rounded-2xl p-4 mb-6">
          <h2 className="font-display font-semibold mb-1">Custom playlist</h2>
          <p className="text-xs text-gray-500 mb-3">
            Paste a public Spotify or YouTube playlist link to play with your own songs.
            This turns off the preset challenges below.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              inputMode="url"
              autoComplete="off"
              value={playlistDraft}
              placeholder="https://open.spotify.com/playlist/… or YouTube playlist URL"
              onChange={(e) => setPlaylistDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  loadPlaylist();
                }
              }}
              className="input-field text-sm flex-1 min-w-0"
            />
            <button
              type="button"
              className="btn-primary shrink-0 px-5 py-3 sm:py-0"
              disabled={playlistLoading || !playlistDraft.trim()}
              onClick={loadPlaylist}
            >
              {playlistLoading ? "Loading…" : "Load playlist"}
            </button>
          </div>
          {isCustom ? (
            <div className="mt-3 flex items-start justify-between gap-3">
              <p
                className={`text-xs ${
                  playlistStatus === "error"
                    ? "text-red-400"
                    : playlistStatus === "loading"
                      ? "text-amber-400"
                      : playlistStatus === "ready"
                        ? "text-vinyl-accent"
                        : "text-gray-500"
                }`}
              >
                {playlistStatus === "loading" && "Loading playlist…"}
                {playlistStatus === "ready" &&
                  `Ready · ${room.tracks.length} songs from “${room.settings.customPlaylistTitle ?? "playlist"}”`}
                {playlistStatus === "error" &&
                  (room.playlistError || "Could not load playlist.")}
                {playlistStatus === "idle" && "Paste a link and tap Load playlist."}
              </p>
              <button
                type="button"
                className="text-xs text-gray-400 hover:text-white shrink-0"
                onClick={clearPlaylist}
              >
                Clear
              </button>
            </div>
          ) : (
            <p className="text-xs text-gray-500 mt-2">
              Leave empty to use Jay Chou or a preset challenge below.
            </p>
          )}
        </section>
      )}

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

          <div className="mt-5 pt-5 border-t border-vinyl-border space-y-4">
            <p className="text-xs text-gray-500">
              Preset challenges — only one mode can be active
            </p>

            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium leading-snug">
                  Tien Family Favorites Challenge
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {isTienFamily
                    ? "Kid's Faves for Game · 30 songs"
                    : isCustom
                      ? "Off — custom playlist is active"
                      : isDanton
                        ? "Off — Danton's playlist is active"
                        : "Jay Chou discography (default)"}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isTienFamily}
                aria-label="Tien Family Favorites Challenge"
                onClick={() =>
                  selectBuiltInMode(isTienFamily ? "jayChou" : "tienFamily")
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

            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium leading-snug">
                  Danton&apos;s Favorites Challenge
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {isDanton
                    ? "Danton's playlist · 50 songs"
                    : isCustom
                      ? "Off — custom playlist is active"
                      : isTienFamily
                        ? "Off — Tien Family playlist is active"
                        : "Jay Chou discography (default)"}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isDanton}
                aria-label="Danton's Favorites Challenge"
                onClick={() =>
                  selectBuiltInMode(isDanton ? "jayChou" : "dantonFavorites")
                }
                className={`relative shrink-0 w-12 h-7 rounded-full transition-colors ${
                  isDanton ? "bg-vinyl-accent" : "bg-vinyl-card border border-vinyl-border"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                    isDanton ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </section>
      )}

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

      <div className="flex flex-col gap-3">
        <button
          className={`w-full py-3 rounded-full font-semibold transition-all active:scale-95 ${
            me?.isReady
              ? "bg-vinyl-card border border-vinyl-accent text-vinyl-accent"
              : "btn-primary"
          }`}
          onClick={() => {
            primeAudioInUserGesture();
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
              primeAudioInUserGesture();
              onStart();
            }}
          >
            {playlistLoading
              ? "Loading playlist…"
              : isCustom && !playlistReady
                ? "Load a playlist to start"
                : allReady
                  ? "Start Game"
                  : "Waiting for everyone to ready up…"}
          </button>
        )}
      </div>
    </main>
  );
}
