/** Tiny silent WAV used to unlock mobile audio in a user-gesture handler. */
const SILENT_WAV =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

let sessionUnlocked = false;

export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

export function isAudioSessionUnlocked(): boolean {
  return sessionUnlocked;
}

/** Call from a click/tap handler so later programmatic audio.play() is allowed. */
export async function unlockAudioSession(audio?: HTMLAudioElement): Promise<boolean> {
  if (sessionUnlocked) return true;

  const el = audio ?? new Audio(SILENT_WAV);
  if (!audio) {
    el.src = SILENT_WAV;
  }

  try {
    const prevVolume = el.volume;
    el.volume = 0.001;
    el.currentTime = 0;
    await el.play();
    el.pause();
    el.currentTime = 0;
    el.volume = prevVolume;
    sessionUnlocked = true;
    return true;
  } catch {
    return false;
  }
}
