/**
 * Map server timestamps to local monotonic time at receive.
 * Avoids comparing Date.now() directly to server Date.now() (device clock skew).
 */
export type ServerClockAnchor = {
  serverMs: number;
  localMs: number;
};

export function createServerClockAnchor(serverMs: number): ServerClockAnchor {
  return { serverMs, localMs: Date.now() };
}

export function serverNow(anchor: ServerClockAnchor): number {
  return anchor.serverMs + (Date.now() - anchor.localMs);
}

export function msUntilServerTime(anchor: ServerClockAnchor, targetServerMs: number): number {
  return Math.max(0, targetServerMs - serverNow(anchor));
}

export function elapsedServerSeconds(
  anchor: ServerClockAnchor,
  startServerMs: number
): number {
  return (serverNow(anchor) - startServerMs) / 1000;
}
