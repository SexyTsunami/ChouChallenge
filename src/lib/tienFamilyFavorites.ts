/**
 * Portland2023 — Mei Tien's Spotify family favorites playlist.
 * `name` = song title, `english` = artist (shown as subtitle in the UI).
 * https://open.spotify.com/playlist/3X8JiOW4HgWEgjenx3xgQw
 */
import type { TrackInfo } from "@/types/game";

export const TIEN_FAMILY_SONGS: TrackInfo[] = [
  { id: "safe-and-sound", name: "Safe And Sound", english: "Capital Cities" },
  { id: "mates-of-soul", name: "The Mates of Soul", english: "Taylor John Williams" },
  { id: "bubble-toes", name: "Bubble Toes", english: "Jack Johnson" },
  { id: "soul-bossa-nova", name: "Soul Bossa Nova", english: "Quincy Jones" },
  { id: "drunk", name: "drunk", english: "keshi" },
  { id: "circles", name: "Circles", english: "Post Malone" },
  {
    id: "i-like-you",
    name: "I Like You (A Happier Song)",
    english: "Post Malone, Doja Cat",
  },
  { id: "double-take", name: "double take", english: "Dhruv" },
  { id: "sunroof", name: "Sunroof", english: "Nicky Youre, dazy" },
  { id: "amazing", name: "AMAZING", english: "Rex Orange County" },
  {
    id: "across-the-room",
    name: "Across the Room",
    english: "Public Library Commute, Forrest.",
  },
  { id: "waves", name: "Waves", english: "Fiji Blue" },
  { id: "parachute", name: "parachute", english: "John K" },
  { id: "summer-vibe", name: "Summer Vibe", english: "Forrest Nolan" },
  {
    id: "falling-in-love-feels-like",
    name: "this is what falling in love feels like",
    english: "JVKE",
  },
  { id: "summer-nights", name: "summer nights", english: "The Millennial Club" },
  { id: "sheluvme", name: "sheluvme", english: "Tai Verdes" },
  { id: "lovely-day", name: "Lovely Day", english: "Bill Withers" },
  { id: "hotel-california", name: "Hotel California", english: "Eagles" },
  { id: "flowers", name: "Flowers", english: "Miley Cyrus" },
  { id: "cold-heart", name: "Cold Heart", english: "Elton John, Dua Lipa, PNAU" },
  { id: "i-aint-worried", name: "I Ain't Worried", english: "OneRepublic" },
  { id: "can-i-call-you-tonight", name: "Can I Call You Tonight?", english: "Dayglow" },
  {
    id: "less-i-know-the-better",
    name: "The Less I Know The Better",
    english: "Tame Impala",
  },
  { id: "deja-vu", name: "deja vu", english: "Olivia Rodrigo" },
  { id: "love-story", name: "Love Story (Taylor's Version)", english: "Taylor Swift" },
  { id: "remember-when", name: "Remember When", english: "Wallows" },
  { id: "yellow", name: "Yellow", english: "Coldplay" },
  {
    id: "leave-the-door-open",
    name: "Leave The Door Open",
    english: "Bruno Mars, Anderson .Paak, Silk Sonic",
  },
  { id: "slide-away", name: "Slide Away", english: "Miley Cyrus" },
];

export function getTienFamilySongList(): TrackInfo[] {
  const seen = new Set<string>();
  return TIEN_FAMILY_SONGS.filter((s) => {
    if (seen.has(s.name)) return false;
    seen.add(s.name);
    return true;
  });
}
