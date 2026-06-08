"use client";

import { useEffect, useRef, useState } from "react";

interface RoundTimerProps {
  timerSeconds: number;
  roundStartTime: number;
  onExpire?: () => void;
}

export default function RoundTimer({
  timerSeconds,
  roundStartTime,
  onExpire,
}: RoundTimerProps) {
  const [remaining, setRemaining] = useState(timerSeconds);
  const expiredRef = useRef(false);

  const syncing = roundStartTime <= 0;

  useEffect(() => {
    expiredRef.current = false;

    if (syncing) {
      setRemaining(timerSeconds);
      return;
    }

    const tick = () => {
      const elapsed = (Date.now() - roundStartTime) / 1000;
      const left = Math.max(0, timerSeconds - elapsed);
      setRemaining(Math.ceil(left));
      if (left <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpire?.();
      }
    };

    tick();
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [timerSeconds, roundStartTime, onExpire, syncing]);

  const pct = syncing ? 100 : (remaining / timerSeconds) * 100;
  const urgent = !syncing && remaining <= 5;

  return (
    <div className="w-full max-w-xs mx-auto">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">{syncing ? "Syncing" : "Time left"}</span>
        <span
          className={`font-mono font-bold ${
            syncing ? "text-amber-400" : urgent ? "text-red-400" : "text-vinyl-accent"
          }`}
        >
          {syncing ? "…" : `${remaining}s`}
        </span>
      </div>
      <div className="h-2 bg-vinyl-card rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-200 rounded-full ${
            syncing ? "bg-amber-400/60 animate-pulse" : urgent ? "bg-red-500" : "bg-vinyl-accent"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
