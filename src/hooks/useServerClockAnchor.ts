import { useRef } from "react";
import {
  createServerClockAnchor,
  type ServerClockAnchor,
} from "@/lib/serverClock";

/** Anchor a server timestamp to this device's clock when the value becomes active. */
export function useServerClockAnchor(serverMs: number): ServerClockAnchor | null {
  const anchorRef = useRef<ServerClockAnchor | null>(null);

  if (serverMs <= 0) {
    anchorRef.current = null;
    return null;
  }

  if (!anchorRef.current || anchorRef.current.serverMs !== serverMs) {
    anchorRef.current = createServerClockAnchor(serverMs);
  }

  return anchorRef.current;
}
