import type { GameMode, TrackInfo } from "@/types/game";
import { getJayChouSongList } from "./jayChouSongs";
import { getTienFamilySongList } from "./tienFamilyFavorites";

export function getTracksForMode(mode: GameMode): TrackInfo[] {
  return mode === "tienFamily" ? getTienFamilySongList() : getJayChouSongList();
}

export function getGameModeLabel(mode: GameMode): string {
  return mode === "tienFamily" ? "Tien Family Favorites Challenge" : "Jay Chou Challenge";
}
