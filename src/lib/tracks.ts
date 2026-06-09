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
    default:
      return getJayChouSongList();
  }
}

export function getGameModeLabel(mode: GameMode): string {
  switch (mode) {
    case "tienFamily":
      return "Tien Family Favorites Challenge";
    case "dantonFavorites":
      return "Danton's Favorites Challenge";
    default:
      return "Jay Chou Challenge";
  }
}
