import type { GameMode, TrackInfo } from "@/types/game";
import { getDantonFavoritesSongList } from "./dantonFavorites";
import { getJayChouSongList } from "./jayChouSongs";
import { getTienFamilySongList } from "./tienFamilyFavorites";

export function getTracksForMode(mode: GameMode): TrackInfo[] {
  switch (mode) {
    case "tienFamily":
      return getTienFamilySongList();
    case "dantonFavorites":
      return getDantonFavoritesSongList();
    case "custom":
      return [];
    default:
      return getJayChouSongList();
  }
}

export function getGameModeLabel(mode: GameMode, customTitle?: string): string {
  switch (mode) {
    case "tienFamily":
      return "Tien Family Favorites Challenge";
    case "dantonFavorites":
      return "Danton's Favorites Challenge";
    case "custom":
      return customTitle?.trim()
        ? `Custom: ${customTitle.trim()}`
        : "Custom Playlist Challenge";
    default:
      return "Jay Chou Challenge";
  }
}

export function isValidGameMode(mode: unknown): mode is GameMode {
  return (
    mode === "jayChou" ||
    mode === "tienFamily" ||
    mode === "dantonFavorites" ||
    mode === "custom"
  );
}
