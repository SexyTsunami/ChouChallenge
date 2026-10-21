/** YouTube embed helpers — mobile needs muted unlock + tap-to-unmute. */

export type YoutubeEmbedOptions = {
  startSec: number;
  durationSec: number;
  /** Start muted (required for mobile autoplay unlock). */
  mute?: boolean;
  autoplay?: boolean;
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
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://localhost";

  const params = new URLSearchParams({
    autoplay: opts.autoplay === false ? "0" : "1",
    mute: opts.mute ? "1" : "0",
    controls: "0",
    modestbranding: "1",
    playsinline: "1",
    rel: "0",
    enablejsapi: "1",
    origin,
    start: String(start),
    end: String(end),
  });

  // youtube.com embeds are more reliable for mobile autoplay than nocookie.
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

export function postYoutubeCommand(
  iframe: HTMLIFrameElement | null,
  func: string,
  args: unknown[] = []
): void {
  if (!iframe?.contentWindow) return;
  try {
    iframe.contentWindow.postMessage(
      JSON.stringify({ event: "command", func, args }),
      "*"
    );
  } catch {
    // Cross-origin / not ready yet
  }
}

/** Tell the widget API we're listening so subsequent commands are accepted. */
export function bindYoutubeListening(iframe: HTMLIFrameElement | null): void {
  if (!iframe?.contentWindow) return;
  try {
    iframe.contentWindow.postMessage(
      JSON.stringify({ event: "listening", id: 1, channel: "widget" }),
      "*"
    );
  } catch {
    // ignore
  }
}

export function youtubeUnmuteAndPlay(iframe: HTMLIFrameElement | null): void {
  bindYoutubeListening(iframe);
  postYoutubeCommand(iframe, "unMute");
  postYoutubeCommand(iframe, "setVolume", [100]);
  postYoutubeCommand(iframe, "playVideo");
}

export function youtubePause(iframe: HTMLIFrameElement | null): void {
  postYoutubeCommand(iframe, "pauseVideo");
}

export function youtubeSeekAndPlay(
  iframe: HTMLIFrameElement | null,
  startSec: number
): void {
  bindYoutubeListening(iframe);
  postYoutubeCommand(iframe, "seekTo", [Math.max(0, startSec), true]);
  postYoutubeCommand(iframe, "unMute");
  postYoutubeCommand(iframe, "setVolume", [100]);
  postYoutubeCommand(iframe, "playVideo");
}

export function isLikelyMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}
