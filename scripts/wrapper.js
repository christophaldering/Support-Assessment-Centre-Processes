const { spawn, execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const http = require("http");

const PORT = 5000;
const INTERNAL_PORT = 5001;
const HEALTH_INTERVAL = 15000;
const STARTUP_GRACE = 30000;
const MAX_RESTART_DELAY = 60000;
const PID_FILE = path.join(process.cwd(), ".next-server.pid");

const standaloneDir = path.join(process.cwd(), ".next", "standalone");
const hasStandalone = fs.existsSync(path.join(standaloneDir, "server.js"));
const isDeployment = !!process.env.REPL_DEPLOYMENT;

if (hasStandalone) {
  startProductionDirect();
} else if (isDeployment) {
  console.error("[wrapper] FATAL: No standalone build found in deployment environment. Build must succeed before deploying.");
  process.exit(1);
} else {
  startDevWithProxy();
}

function startProductionDirect() {
  console.log("[wrapper] Production mode — starting standalone server directly on port " + PORT);

  try {
    execSync("cp -rn .next/static .next/standalone/.next/static 2>/dev/null", { stdio: "ignore" });
    execSync("cp -rn public .next/standalone/public 2>/dev/null", { stdio: "ignore" });
  } catch {}

  const child = spawn(process.execPath, ["server.js"], {
    stdio: "inherit",
    cwd: standaloneDir,
    env: { ...process.env, PORT: String(PORT), HOSTNAME: "0.0.0.0", NEXT_TELEMETRY_DISABLED: "1" },
  });

  child.on("exit", (code, signal) => {
    console.log(`[wrapper] Production server exited: code=${code} signal=${signal}`);
    process.exit(code || 1);
  });

  process.on("SIGTERM", () => { child.kill("SIGTERM"); });
  process.on("SIGINT", () => { child.kill("SIGINT"); });
}

function startDevWithProxy() {
  let childPid = null;
  let isStarting = false;
  let lastStartTime = 0;
  let consecutiveFailures = 0;
  let serverReady = false;

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

    try { execSync(`fuser -k ${INTERNAL_PORT}/tcp 2>/dev/null`, { stdio: "ignore" }); } catch {}
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

  function proxyRequest(clientReq, clientRes) {
    if (!serverReady) {
      clientRes.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
      clientRes.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Loading...</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0f172a;color:#94a3b8;font-family:system-ui,-apple-system,sans-serif}
.c{text-align:center}.s{width:32px;height:32px;border:3px solid #334155;border-top-color:#3b82f6;border-radius:50%;animation:r .8s linear infinite;margin:0 auto 1.5rem}
@keyframes r{to{transform:rotate(360deg)}}h2{color:#e2e8f0;font-size:1.125rem;font-weight:500;margin:0 0 .5rem}p{font-size:.875rem;margin:0}</style>
</head><body><div class="c"><div class="s"></div><h2>Executive Diagnostics</h2><p>Wird geladen...</p></div>
<script>setTimeout(function(){location.reload()},5000)</script></body></html>`);
      return;
    }

    const fwdHeaders = Object.assign({}, clientReq.headers);
    delete fwdHeaders["host"];

    const opts = {
      hostname: "127.0.0.1",
      port: INTERNAL_PORT,
      path: clientReq.url,
      method: clientReq.method,
      headers: fwdHeaders,
      timeout: 30000,
    };

    const proxyReq = http.request(opts, (proxyRes) => {
      clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(clientRes, { end: true });
    });

    proxyReq.on("error", (err) => {
      console.log("[wrapper] Proxy error: " + err.message);
      if (!clientRes.headersSent) {
        clientRes.writeHead(502, { "Content-Type": "text/html; charset=utf-8" });
        clientRes.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Loading...</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0f172a;color:#94a3b8;font-family:system-ui,-apple-system,sans-serif}
.c{text-align:center}h2{color:#e2e8f0;font-size:1.125rem;font-weight:500;margin:0 0 .5rem}p{font-size:.875rem;margin:0}</style>
</head><body><div class="c"><h2>Executive Diagnostics</h2><p>Verbindung wird hergestellt...</p></div>
<script>setTimeout(function(){location.reload()},3000)</script></body></html>`);
      }
    });

    proxyReq.on("timeout", () => { proxyReq.destroy(); });

    clientReq.pipe(proxyReq, { end: true });
  }

  function warmup(callback) {
    console.log("[wrapper] Warming up root page...");
    const chunks = [
      "/",
      "/_next/static/chunks/app/page.js",
      "/_next/static/chunks/app/error.js",
      "/_next/static/chunks/app/global-error.js",
      "/_next/static/chunks/app-pages-internals.js",
    ];

    let completed = 0;
    let called = false;

    function done() {
      completed++;
      if (completed >= 1 && !called) {
        called = true;
        console.log("[wrapper] Warmup complete, accepting connections");
        callback();
      }
    }

    function fetchUrl(urlPath, attempt) {
      if (attempt > 20) { done(); return; }
      const req = http.get({ hostname: "127.0.0.1", port: INTERNAL_PORT, path: urlPath, timeout: 15000 }, (res) => {
        res.resume();
        if (res.statusCode === 200) {
          done();
        } else {
          setTimeout(() => fetchUrl(urlPath, attempt + 1), 500);
        }
      });
      req.on("error", () => { setTimeout(() => fetchUrl(urlPath, attempt + 1), 500); });
      req.on("timeout", () => { req.destroy(); setTimeout(() => fetchUrl(urlPath, attempt + 1), 500); });
    }

    fetchUrl("/", 0);
    setTimeout(() => {
      for (let i = 1; i < chunks.length; i++) fetchUrl(chunks[i], 0);
    }, 2000);

    setTimeout(() => { if (!called) { called = true; console.log("[wrapper] Warmup timeout, accepting connections anyway"); callback(); } }, 120000);
  }

  function waitForServer(callback) {
    const check = () => {
      const req = http.get({ hostname: "127.0.0.1", port: INTERNAL_PORT, path: "/", timeout: 3000 }, (res) => {
        res.resume();
        callback();
      });
      req.on("error", () => setTimeout(check, 500));
      req.on("timeout", () => { req.destroy(); setTimeout(check, 500); });
    };
    check();
  }

  function startServer() {
    if (isStarting) return;
    isStarting = true;
    serverReady = false;

    killChild();

    const cmd = path.join(process.cwd(), "node_modules", ".bin", "next");
    const args = ["dev", "-p", String(INTERNAL_PORT), "-H", "0.0.0.0"];
    const cwd = process.cwd();
    console.log("[wrapper] Starting dev server on port " + INTERNAL_PORT);

    const child = spawn(cmd, args, {
      stdio: "inherit",
      cwd,
      detached: true,
      env: { ...process.env, PORT: String(INTERNAL_PORT), HOSTNAME: "0.0.0.0", NEXT_TELEMETRY_DISABLED: "1" },
    });

    childPid = child.pid;
    savePid(child.pid);
    child.unref();
    lastStartTime = Date.now();

    child.on("exit", (code, signal) => {
      console.log(`[wrapper] Server exited: code=${code} signal=${signal}`);
      if (childPid === child.pid) childPid = null;
    });

    waitForServer(() => {
      warmup(() => {
        serverReady = true;
        isStarting = false;
      });
    });
  }

  function healthCheck() {
    if (isStarting || !serverReady || Date.now() - lastStartTime < STARTUP_GRACE) return;

    const port = serverReady ? INTERNAL_PORT : PORT;
    const req = http.get(`http://127.0.0.1:${port}/`, { timeout: 5000 }, (res) => {
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

  const proxy = http.createServer(proxyRequest);

  proxy.on("upgrade", (req, socket, head) => {
    if (!serverReady) { socket.destroy(); return; }
    const wsHeaders = Object.assign({}, req.headers);
    delete wsHeaders["host"];
    const opts = {
      hostname: "127.0.0.1",
      port: INTERNAL_PORT,
      path: req.url,
      method: req.method,
      headers: wsHeaders,
    };
    const proxyReq = http.request(opts);
    proxyReq.on("upgrade", (proxyRes, proxySocket, proxyHead) => {
      socket.write("HTTP/1.1 101 Switching Protocols\r\n" +
        Object.entries(proxyRes.headers).map(([k,v]) => k + ": " + v).join("\r\n") + "\r\n\r\n");
      if (proxyHead && proxyHead.length) socket.write(proxyHead);
      proxySocket.pipe(socket);
      socket.pipe(proxySocket);
    });
    proxyReq.on("error", () => { socket.destroy(); });
    proxyReq.end();
  });

  proxy.listen(PORT, "0.0.0.0", () => {
    console.log("[wrapper] Proxy listening on port " + PORT);
    startServer();
  });

  setInterval(healthCheck, HEALTH_INTERVAL);
}
