const { spawn, execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const http = require("http");

const PORT = 5000;
const HEALTH_INTERVAL = 15000;
const STARTUP_GRACE = 30000;
const MAX_RESTART_DELAY = 60000;
const PID_FILE = path.join(process.cwd(), ".next-server.pid");

let childPid = null;
let isStarting = false;
let lastStartTime = 0;
let consecutiveFailures = 0;

function savePid(pid) {
  try { fs.writeFileSync(PID_FILE, String(pid)); } catch {}
}

function loadSavedPid() {
  try {
    const pid = parseInt(fs.readFileSync(PID_FILE, "utf8").trim(), 10);
    if (pid > 0) return pid;
  } catch {}
  return null;
}

function killChild() {
  const savedPid = loadSavedPid();
  const pidsToKill = new Set();
  if (childPid) pidsToKill.add(childPid);
  if (savedPid) pidsToKill.add(savedPid);

  for (const pid of pidsToKill) {
    try { process.kill(-pid, "SIGTERM"); } catch {}
    try { process.kill(pid, "SIGTERM"); } catch {}
  }

  childPid = null;

  try { execSync(`fuser -k ${PORT}/tcp 2>/dev/null`, { stdio: "ignore" }); } catch {}

  try { fs.unlinkSync(PID_FILE); } catch {}

  if (pidsToKill.size > 0) {
    try {
      execSync("sleep 1", { stdio: "ignore" });
      for (const pid of pidsToKill) {
        try { process.kill(-pid, "SIGKILL"); } catch {}
        try { process.kill(pid, "SIGKILL"); } catch {}
      }
    } catch {}
  }
}

function startServer() {
  if (isStarting) return;
  isStarting = true;

  killChild();

  const standaloneDir = path.join(process.cwd(), ".next", "standalone");
  const hasStandalone = fs.existsSync(path.join(standaloneDir, "server.js"));

  let cmd, args, cwd;
  if (hasStandalone) {
    try {
      execSync("cp -rn .next/static .next/standalone/.next/static 2>/dev/null", { stdio: "ignore" });
      execSync("cp -rn public .next/standalone/public 2>/dev/null", { stdio: "ignore" });
    } catch {}
    cmd = process.execPath;
    args = ["server.js"];
    cwd = standaloneDir;
    console.log("[wrapper] Starting production server on port " + PORT);
  } else {
    cmd = path.join(process.cwd(), "node_modules", ".bin", "next");
    args = ["dev", "-p", String(PORT), "-H", "0.0.0.0"];
    cwd = process.cwd();
    console.log("[wrapper] Starting dev server on port " + PORT);
  }

  const child = spawn(cmd, args, {
    stdio: "inherit",
    cwd,
    detached: true,
    env: { ...process.env, PORT: String(PORT), HOSTNAME: "0.0.0.0", NEXT_TELEMETRY_DISABLED: "1" },
  });

  childPid = child.pid;
  savePid(child.pid);
  child.unref();
  lastStartTime = Date.now();

  child.on("exit", (code, signal) => {
    console.log(`[wrapper] Server exited: code=${code} signal=${signal}`);
    if (childPid === child.pid) childPid = null;
  });

  setTimeout(() => { isStarting = false; }, 5000);
}

function healthCheck() {
  if (isStarting || Date.now() - lastStartTime < STARTUP_GRACE) return;

  const req = http.get(`http://127.0.0.1:${PORT}/`, { timeout: 5000 }, (res) => {
    res.resume();
    const ok = res.statusCode >= 200 && res.statusCode < 400;
    if (ok) {
      consecutiveFailures = 0;
    } else {
      consecutiveFailures++;
      console.log(`[wrapper] Health check status ${res.statusCode} (failure ${consecutiveFailures})`);
      if (consecutiveFailures >= 3) {
        const delay = Math.min(consecutiveFailures * 5000, MAX_RESTART_DELAY);
        console.log(`[wrapper] Restarting after ${delay}ms backoff...`);
        setTimeout(startServer, delay);
        consecutiveFailures = 0;
      }
    }
  });
  req.on("error", () => {
    consecutiveFailures++;
    console.log(`[wrapper] Server unreachable (failure ${consecutiveFailures})`);
    if (consecutiveFailures >= 3) {
      const delay = Math.min(consecutiveFailures * 5000, MAX_RESTART_DELAY);
      console.log(`[wrapper] Restarting after ${delay}ms backoff...`);
      setTimeout(startServer, delay);
      consecutiveFailures = 0;
    }
  });
  req.on("timeout", () => { req.destroy(); });
}

startServer();
setInterval(healthCheck, HEALTH_INTERVAL);
