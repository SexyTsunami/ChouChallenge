/**
 * Kid's Faves for Game — Mei Tien's Spotify family playlist.
 * `name` = song title (Disney/Ghibli titles include the film in parentheses).
 * `english` = artist (shown as subtitle in the UI).
 * https://open.spotify.com/playlist/2ZAbzDpSme2te4QkYS5YRL
 */
import type { TrackInfo } from "@/types/game";

export const TIEN_FAMILY_SONGS: TrackInfo[] = [
  {
    id: "ppap",
    name: "PPAP (Pen-Pineapple-Apple-Pen)",
    english: "PIKOTARO",
  },
  {
    id: "golden",
    name: "Golden",
    english: "HUNTR/X, EJAE, AUDREY NUNA, REI AMI",
  },
  { id: "the-cat-song", name: "The Cat Song", english: "Bryant Oden" },
  { id: "rude", name: "Rude", english: "MAGIC!" },
  { id: "cupid", name: "Cupid", english: "FIFTY FIFTY" },
  {
    id: "beauty-and-the-beast",
    name: "Beauty and the Beast (Beauty and the Beast)",
    english: "Angela Lansbury",
  },
  {
    id: "bare-necessities",
    name: "The Bare Necessities (The Jungle Book)",
    english: "Phil Harris, Bruce Reitherman",
  },
  {
    id: "youre-welcome",
    name: "You're Welcome (Moana)",
    english: "Dwayne Johnson",
  },
  {
    id: "we-dont-talk-about-bruno",
    name: "We Don't Talk About Bruno (Encanto)",
    english: "Carolina Gaitán, Mauro Castillo, Adassa",
  },
  {
    id: "how-far-ill-go",
    name: "How Far I'll Go (Moana)",
    english: "Auli'i Cravalho",
  },
  {
    id: "for-the-first-time-in-forever",
    name: "For the First Time in Forever (Frozen)",
    english: "Kristen Bell, Idina Menzel",
  },
  {
    id: "surface-pressure",
    name: "Surface Pressure (Encanto)",
    english: "Jessica Darrow",
  },
  {
    id: "a-whole-new-world",
    name: "A Whole New World (Aladdin)",
    english: "Lea Salonga, Brad Kane",
  },
  {
    id: "hakuna-matata",
    name: "Hakuna Matata (The Lion King)",
    english: "Nathan Lane, Ernie Sabella, Jason Weaver",
  },
  {
    id: "be-our-guest",
    name: "Be Our Guest (Beauty and the Beast)",
    english: "Angela Lansbury, Jerry Orbach",
  },
  {
    id: "friend-like-me",
    name: "Friend Like Me (Aladdin)",
    english: "Will Smith",
  },
  {
    id: "can-you-feel-the-love-tonight",
    name: "Can You Feel the Love Tonight (The Lion King)",
    english: "Joseph Williams, Sally Dworsky, Nathan Lane",
  },
  {
    id: "circle-of-life",
    name: "Circle of Life (The Lion King)",
    english: "Carmen Twillie, Lebo M.",
  },
  {
    id: "married-life",
    name: "Married Life (Up)",
    english: "Michael Giacchino",
  },
  { id: "yum-yum-breakfast-burrito", name: "Yum Yum Breakfast Burrito", english: "Parry Gripp" },
  {
    id: "levitating",
    name: "Levitating (feat. DaBaby)",
    english: "Dua Lipa, DaBaby",
  },
  { id: "love-again", name: "Love Again", english: "Dua Lipa" },
  {
    id: "journey-starts-today",
    name: "The Journey Starts Today",
    english: "Walk off the Earth, Pokémon",
  },
  {
    id: "die-with-a-smile",
    name: "Die With A Smile",
    english: "Lady Gaga, Bruno Mars",
  },
  {
    id: "blue-da-ba-dee",
    name: "Blue (Da Ba Dee)",
    english: "Eiffel 65, Gabry Ponte",
  },
  { id: "shake-it-off", name: "Shake It Off", english: "Taylor Swift" },
  { id: "slippery-fish", name: "Slippery Fish", english: "Amy Liz" },
  { id: "goin-to-the-zoo", name: "Goin' to the Zoo", english: "Amy Liz" },
  { id: "luna-mezzo-mare", name: "Luna Mezzo Mare", english: "Lou Monte" },
  { id: "mashed-potato-time", name: "Mashed Potato Time", english: "Dee Dee Sharp" },
];

export function getTienFamilySongList(): TrackInfo[] {
  const seen = new Set<string>();
  return TIEN_FAMILY_SONGS.filter((s) => {
    if (seen.has(s.name)) return false;
    seen.add(s.name);
    return true;
  });
}
