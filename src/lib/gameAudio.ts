/** Tiny silent WAV — played once inside a user-gesture handler to unlock playback. */
const SILENT_WAV =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

let sharedAudio: HTMLAudioElement | null = null;
let sessionUnlocked = false;

/** One persistent <audio> for the whole game — iOS allows later play() on the same element. */
export function getSharedAudio(): HTMLAudioElement {
  if (typeof window === "undefined") {
    throw new Error("getSharedAudio() is client-only");
  }
  if (!sharedAudio) {
    sharedAudio = new Audio();
    sharedAudio.preload = "auto";
  }
  return sharedAudio;
}

export function isGameAudioUnlocked(): boolean {
  return sessionUnlocked;
}

/** Call from a click/tap handler (Ready, sync button, etc.). */
export async function unlockGameAudio(): Promise<boolean> {
  if (sessionUnlocked) return true;

  const audio = getSharedAudio();
  const prevSrc = audio.src;
  const prevVolume = audio.volume;

  try {
    audio.src = SILENT_WAV;
    audio.volume = 0.001;
    audio.currentTime = 0;
    await audio.play();
    audio.pause();
    audio.currentTime = 0;
    audio.volume = prevVolume;
    audio.src = prevSrc || "";
    if (prevSrc) audio.load();
    sessionUnlocked = true;
    return true;
  } catch {
    audio.volume = prevVolume;
    audio.src = prevSrc || "";
    if (prevSrc) audio.load();
    return false;
  }
}

export function loadGameAudioSource(url: string): HTMLAudioElement {
  const audio = getSharedAudio();
  if (!audio.src.endsWith(url)) {
    audio.src = url;
    audio.load();
  }
  return audio;
}
