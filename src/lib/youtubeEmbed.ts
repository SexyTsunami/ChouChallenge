/** YouTube embed helpers for gesture-safe mobile playback. */

export type YoutubeEmbedOptions = {
  startSec: number;
  durationSec: number;
  mute?: boolean;
  autoplay?: boolean;
  /** Show player controls (useful on review so users can unmute). */
  controls?: boolean;
};

export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function youtubeEmbedUrl(
  videoId: string,
  startSecOrOpts: number | YoutubeEmbedOptions,
  durationSec = 30
): string {
  const opts: YoutubeEmbedOptions =
    typeof startSecOrOpts === "number"
      ? { startSec: startSecOrOpts, durationSec, mute: false, autoplay: true }
      : { mute: false, autoplay: true, ...startSecOrOpts };

  const start = Math.max(0, Math.floor(opts.startSec));
  const end = start + Math.max(1, Math.floor(opts.durationSec));

  const params = new URLSearchParams({
    autoplay: opts.autoplay === false ? "0" : "1",
    mute: opts.mute ? "1" : "0",
    controls: opts.controls ? "1" : "0",
    modestbranding: "1",
    playsinline: "1",
    rel: "0",
    fs: "0",
    iv_load_policy: "3",
    start: String(start),
    end: String(end),
  });

  // Help YouTube associate the embed with this site (reduces Error 153 / blocked autoplay).
  if (typeof window !== "undefined" && window.location?.origin) {
    params.set("origin", window.location.origin);
  }

  // Cache-bust so a second tap always forces a fresh player load.
  params.set("_", String(Date.now()));

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

/**
 * Set iframe.src synchronously inside a click/tap handler.
 * React setState mounts the iframe AFTER the gesture ends — that breaks mobile sound.
 */
export function startYoutubeInGesture(
  iframe: HTMLIFrameElement | null,
  videoId: string,
  opts: YoutubeEmbedOptions
): boolean {
  if (!iframe) return false;
  iframe.src = youtubeEmbedUrl(videoId, opts);
  return true;
}

export function stopYoutubeIframe(iframe: HTMLIFrameElement | null): void {
  if (!iframe) return;
  iframe.src = "about:blank";
}

export function isLikelyMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}
