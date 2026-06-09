/**
 * Danton's Favorites — curated from YouTube playlist "Music".
 * `name` = song title, `english` = artist (subtitle in the UI).
 * https://www.youtube.com/playlist?list=PLkDiQb5yb47eA3OaFUE-XwW156TleBcPQ
 */
import type { TrackInfo } from "@/types/game";

export const DANTON_FAVORITES_SONGS: TrackInfo[] = [
  { id: "somebody-new", name: "Somebody New", english: "Hechmann, Peter Schaw" },
  { id: "savannah", name: "Savannah", english: "Diviners, Philly K" },
  { id: "hear-me-now", name: "Hear Me Now", english: "ALOK, Bruno Martini, ZEEBA" },
  { id: "sandcastles", name: "Sandcastles", english: "Adam Jensen" },
  { id: "firestone", name: "Firestone", english: "Kygo, Conrad Sewell" },
  { id: "latch", name: "Latch", english: "Disclosure" },
  { id: "saving-light", name: "Saving Light", english: "Gareth Emery, Standerwick, HALIENE" },
  { id: "feel-good", name: "Feel Good", english: "Gryffin, Illenium, Daya" },
  { id: "middle", name: "Middle", english: "DJ Snake, Bipolar Sunshine" },
  { id: "happier", name: "Happier", english: "Marshmello, Bastille" },
  { id: "dont-look-down", name: "Don't Look Down", english: "Martin Garrix, Usher" },
  { id: "all-we-know", name: "All We Know", english: "The Chainsmokers, Phoebe Ryan" },
  { id: "fractures", name: "Fractures", english: "Illenium, Nevve" },
  {
    id: "rush-over-me",
    name: "Rush Over Me",
    english: "Seven Lions, Illenium, Said The Sky, HALIENE",
  },
  { id: "shelter", name: "Shelter", english: "Porter Robinson, Madeon" },
  {
    id: "sound-of-walking-away",
    name: "Sound of Walking Away",
    english: "Illenium, Kerli",
  },
  { id: "i-wanna-know", name: "I Wanna Know", english: "NOTD, Bea Miller" },
  { id: "inside-the-lines", name: "Inside The Lines", english: "Mike Perry, Casso" },
  { id: "love-myself", name: "Love Myself", english: "Hailee Steinfeld" },
  { id: "symphony", name: "Symphony", english: "Clean Bandit, Zara Larsson" },
  {
    id: "electricity",
    name: "Electricity",
    english: "Silk City, Dua Lipa, Diplo, Mark Ronson",
  },
  { id: "your-way", name: "Your Way", english: "Jai Wolf, Day Wave" },
  { id: "bloom", name: "Bloom", english: "Dabin, Dia Frampton" },
  { id: "paradise", name: "Paradise", english: "Ikson" },
  { id: "fast-car", name: "Fast Car", english: "Jonas Blue, Dakota" },
  { id: "stay", name: "Stay", english: "Kygo, Maty Noyes" },
  { id: "concrete-angel", name: "Concrete Angel", english: "Gareth Emery, Christina Novelli" },
  { id: "manta", name: "Manta", english: "Lexie Liu" },
  { id: "heroes-tonight", name: "Heroes Tonight", english: "Janji, Johnning" },
  { id: "calling-you-home", name: "Calling You Home", english: "Seven Lions, Runn" },
  { id: "the-adventure", name: "The Adventure", english: "Angels & Airwaves" },
  { id: "sukiyaki", name: "Ue o Muite Arukou (Sukiyaki)", english: "Kyu Sakamoto" },
  { id: "buttercup", name: "Buttercup", english: "Jack Stauber" },
  { id: "through-the-fire", name: "Through the Fire", english: "Chaka Khan" },
  { id: "were-finally-landing", name: "We're Finally Landing", english: "Home" },
  { id: "waves", name: "Waves", english: "DJ Satomi" },
  {
    id: "if-the-world-was-ending",
    name: "If The World Was Ending",
    english: "JP Saxe, Julia Michaels",
  },
  { id: "cinema", name: "Cinema", english: "Benny Benassi, Gary Go" },
  { id: "way-back-home", name: "Way Back Home", english: "SHAUN, Conor Maynard" },
  { id: "best-part", name: "Best Part", english: "H.E.R., Daniel Caesar" },
  { id: "stick-season", name: "Stick Season", english: "Noah Kahan" },
  { id: "a-real-hero", name: "A Real Hero", english: "College, Electric Youth" },
  { id: "im-good-blue", name: "I'm Good (Blue)", english: "David Guetta, Bebe Rexha" },
  { id: "look-at-the-sky", name: "Look at the Sky", english: "Porter Robinson" },
  { id: "can-i-call-you-tonight", name: "Can I Call You Tonight?", english: "Dayglow" },
  { id: "nuvole-bianche", name: "Nuvole Bianche", english: "Ludovico Einaudi" },
  { id: "ruthless", name: "Ruthless", english: "Cannons" },
  { id: "the-ocean", name: "The Ocean", english: "Mike Perry, Shy Martin" },
  { id: "resonance", name: "Resonance", english: "HOME" },
  { id: "all-my-love", name: "ALL MY LOVE", english: "Coldplay" },
];

export function getDantonFavoritesSongList(): TrackInfo[] {
  const seen = new Set<string>();
  return DANTON_FAVORITES_SONGS.filter((s) => {
    if (seen.has(s.name)) return false;
    seen.add(s.name);
    return true;
  });
}
