const http = require("http");
const { spawn } = require("child_process");

const PORT = 5000;
const NEXT_PORT = 5001;
let nextReady = false;

const server = http.createServer((req, res) => {
  if (!nextReady) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Loading</title></head><body style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui;background:#0f172a;color:white"><div style="text-align:center"><p>Starting application...</p></div><script>setInterval(()=>{fetch('/',{method:'HEAD'}).then(r=>{if(r.headers.get('x-powered-by'))location.reload()})},2000)</script></body></html>`);
    return;
  }

  const opts = { hostname: "127.0.0.1", port: NEXT_PORT, path: req.url, method: req.method, headers: req.headers };
  const proxy = http.request(opts, (pRes) => {
    res.writeHead(pRes.statusCode, pRes.headers);
    pRes.pipe(res);
  });
  proxy.on("error", () => { res.writeHead(502); res.end(); });
  req.pipe(proxy);
});

server.on("upgrade", (req, socket) => {
  if (!nextReady) { socket.destroy(); return; }
  const opts = { hostname: "127.0.0.1", port: NEXT_PORT, path: req.url, method: req.method, headers: req.headers };
  const proxy = http.request(opts);
  proxy.on("upgrade", (pRes, pSock) => {
    socket.write("HTTP/1.1 101 Switching Protocols\r\n" + Object.entries(pRes.headers).map(([k,v])=>`${k}: ${v}`).join("\r\n") + "\r\n\r\n");
    pSock.pipe(socket); socket.pipe(pSock);
  });
  proxy.on("error", () => socket.destroy());
  proxy.end();
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[dev] Proxy listening on :${PORT}`);

  const next = spawn("npx", ["next", "dev", "-p", String(NEXT_PORT), "-H", "0.0.0.0"], {
    stdio: "inherit",
    env: { ...process.env, PORT: String(NEXT_PORT), NEXT_TELEMETRY_DISABLED: "1" },
  });

  next.on("exit", (code) => { console.log(`[dev] Next exited (${code})`); process.exit(code ?? 1); });

  (async () => {
    for (let i = 0; i < 120; i++) {
      try {
        await new Promise((ok, fail) => {
          const r = http.get(`http://127.0.0.1:${NEXT_PORT}/api/health`, res => {
            let d = ""; res.on("data", c => d += c); res.on("end", () => ok());
          });
          r.on("error", fail);
          r.setTimeout(10000, () => { r.destroy(); fail(new Error("t")); });
        });
        nextReady = true;
        console.log("[dev] Next.js ready");
        return;
      } catch { await new Promise(r => setTimeout(r, 1000)); }
    }
  })();
});

process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));
