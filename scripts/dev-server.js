const http = require("http");
const { spawn } = require("child_process");
const fs = require("fs");

const PORT = 5000;
const NEXT_PORT = 3456;
let ready = false;

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync("/tmp/dev-server.log", line + "\n");
}

const server = http.createServer((req, res) => {
  if (!ready) {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<html><body><p>Loading...</p><script>setTimeout(()=>location.reload(),3000)</script></body></html>");
    return;
  }
  const p = http.request({ hostname: "127.0.0.1", port: NEXT_PORT, path: req.url, method: req.method, headers: req.headers }, pr => {
    res.writeHead(pr.statusCode, pr.headers);
    pr.pipe(res);
  });
  p.on("error", (e) => { log("proxy error: " + e.message); res.writeHead(502); res.end(); });
  req.pipe(p);
});

server.on("upgrade", (req, socket) => {
  if (!ready) { socket.destroy(); return; }
  const p = http.request({ hostname: "127.0.0.1", port: NEXT_PORT, path: req.url, method: req.method, headers: req.headers });
  p.on("upgrade", (pr, ps) => {
    socket.write("HTTP/1.1 101 Switching Protocols\r\n" + Object.entries(pr.headers).map(([k,v])=>`${k}: ${v}`).join("\r\n") + "\r\n\r\n");
    ps.pipe(socket); socket.pipe(ps);
  });
  p.on("error", () => socket.destroy());
  p.end();
});

server.listen(PORT, "0.0.0.0", () => {
  log("proxy listening on :" + PORT);
  const n = spawn("npx", ["next", "dev", "-p", String(NEXT_PORT), "-H", "0.0.0.0"], {
    stdio: "inherit",
    env: { ...process.env, PORT: String(NEXT_PORT), NEXT_TELEMETRY_DISABLED: "1" }
  });
  n.on("exit", (code, signal) => {
    log("next exited code=" + code + " signal=" + signal);
    process.exit(code ?? 1);
  });

  (async () => {
    for (let i = 0; i < 120; i++) {
      try {
        await new Promise((ok, fail) => {
          const r = http.get("http://127.0.0.1:" + NEXT_PORT + "/api/health", res => {
            let d = ""; res.on("data", c => d += c); res.on("end", () => ok());
          });
          r.on("error", fail);
          r.setTimeout(10000, () => { r.destroy(); fail(); });
        });
        ready = true;
        log("Next.js ready");
        return;
      } catch { await new Promise(r => setTimeout(r, 1000)); }
    }
    log("Next.js failed to start");
  })();
});

process.on("SIGTERM", () => { log("received SIGTERM"); });
process.on("SIGINT", () => { log("received SIGINT"); });
process.on("uncaughtException", (e) => { log("uncaught: " + e.stack); });
process.on("exit", (code) => { log("process exit code=" + code); });
