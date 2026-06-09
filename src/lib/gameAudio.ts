/** Shared game audio — one <audio> element kept for the session (required on iOS). */

let sharedAudio: HTMLAudioElement | null = null;
let loadedPreviewUrl: string | null = null;
let sessionUnlocked = false;
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioContext) audioContext = new Ctx();
  return audioContext;
}

function configureAudioElement(audio: HTMLAudioElement): void {
  audio.setAttribute("playsinline", "true");
  audio.setAttribute("webkit-playsinline", "true");
  audio.preload = "auto";
}

/** One persistent <audio> for the whole game. */
export function getSharedAudio(): HTMLAudioElement {
  if (typeof window === "undefined") {
    throw new Error("getSharedAudio() is client-only");
  }
  if (!sharedAudio) {
    sharedAudio = new Audio();
    configureAudioElement(sharedAudio);
  }
  return sharedAudio;
}

export function isGameAudioUnlocked(): boolean {
  return sessionUnlocked;
}

export function markSessionUnlocked(): void {
  sessionUnlocked = true;
}

export function markSessionLocked(): void {
  sessionUnlocked = false;
}

/**
 * Call synchronously inside click/tap handlers (Ready, Create, etc.).
 * Resumes Web Audio — helps iOS/Safari accept later HTMLAudio playback.
 */
export function primeAudioInUserGesture(): void {
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      void ctx.resume();
    }
  } catch {
    // AudioContext may be unavailable
  }
}

export function loadGameAudioSource(url: string): HTMLAudioElement {
  const audio = getSharedAudio();
  configureAudioElement(audio);
  if (loadedPreviewUrl !== url) {
    loadedPreviewUrl = url;
    audio.src = url;
    audio.load();
  }
  return audio;
}

function invokePlay(audio: HTMLAudioElement, startTime: number, muted: boolean): Promise<void> | null {
  configureAudioElement(audio);
  audio.muted = muted;
  audio.volume = 1;

  try {
    if (startTime > 0 && audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
      audio.currentTime = startTime;
    }
    return audio.play();
  } catch {
    return null;
  }
}

/**
 * iOS/Safari requires play() to be invoked synchronously during the user gesture.
 * Unlock by playing the real preview URL on the shared element.
 */
export function playPreviewInUserGesture(
  audio: HTMLAudioElement,
  startTime: number
): Promise<void> | null {
  const direct = invokePlay(audio, startTime, false);
  if (direct) return direct;

  const muted = invokePlay(audio, startTime, true);
  if (!muted) return null;

  return muted.then(() => {
    audio.muted = false;
  });
}

/** @deprecated Use primeAudioInUserGesture — kept for call-site compatibility. */
export function unlockGameAudio(): Promise<boolean> {
  primeAudioInUserGesture();
  const audio = getSharedAudio();
  const promise = playPreviewInUserGesture(audio, 0);
  if (!promise) return Promise.resolve(false);
  return promise
    .then(() => {
      audio.pause();
      audio.currentTime = 0;
      markSessionUnlocked();
      return true;
    })
    .catch(() => false);
}
