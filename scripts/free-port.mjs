// Frees the dev server port before `npm run dev` starts, so a stale/zombie
// process can never block startup (the cause of the endless "Connecting to
// server…" flash). Runs automatically via the npm "predev" hook.
import { execSync } from "node:child_process";

const port = process.env.PORT ?? "3000";
const isWindows = process.platform === "win32";

function pidsOnPort(port) {
  const pids = new Set();
  try {
    if (isWindows) {
      const out = execSync("netstat -ano -p tcp", { encoding: "utf8" });
      for (const line of out.split(/\r?\n/)) {
        if (!/LISTENING/i.test(line)) continue;
        const cols = line.trim().split(/\s+/);
        const local = cols[1] ?? "";
        if (local.endsWith(`:${port}`)) {
          const pid = cols[cols.length - 1];
          if (pid && pid !== "0") pids.add(pid);
        }
      }
    } else {
      const out = execSync(`lsof -ti tcp:${port}`, { encoding: "utf8" });
      for (const pid of out.split(/\s+/).filter(Boolean)) pids.add(pid);
    }
  } catch {
    // No listeners (or the lookup command failed) — nothing to free.
  }
  return pids;
}

const pids = pidsOnPort(port);
if (pids.size === 0) {
  console.log(`[predev] port ${port} is free`);
} else {
  for (const pid of pids) {
    try {
      execSync(isWindows ? `taskkill /PID ${pid} /F /T` : `kill -9 ${pid}`, {
        stdio: "ignore",
      });
      console.log(`[predev] freed port ${port} (stopped stale PID ${pid})`);
    } catch {
      console.warn(`[predev] could not stop PID ${pid} on port ${port}`);
    }
  }
}
