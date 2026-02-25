const http = require("http");
const { spawn } = require("child_process");

const PORT = 5000;
const NEXT_PORT = 5001;
let nextReady = false;
let pagesWarmed = false;

const loadingHTML = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate">
  <meta http-equiv="Pragma" content="no-cache">
  <title>Executive Diagnostics Suite</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; color: #0f172a; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .loader { text-align: center; }
    .spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1.5rem; }
    @keyframes spin { to { transform: rotate(360deg); } }
    h2 { font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem; }
    p { font-size: 0.875rem; color: #64748b; }
  </style>
  <script>setTimeout(function(){location.reload()}, 2000);</script>
</head>
<body>
  <div class="loader">
    <div class="spinner"></div>
    <h2>Wird geladen...</h2>
    <p>Die Anwendung wird gestartet.</p>
  </div>
</body>
</html>`;

const server = http.createServer((req, res) => {
  if (!pagesWarmed) {
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Pragma": "no-cache",
    });
    res.end(loadingHTML);
    return;
  }

  const options = {
    hostname: "127.0.0.1",
    port: NEXT_PORT,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on("error", () => {
    res.writeHead(502, { "Content-Type": "text/html" });
    res.end(loadingHTML);
  });

  req.pipe(proxyReq);
});

server.on("upgrade", (req, socket, head) => {
  if (!pagesWarmed) return socket.destroy();

  const options = {
    hostname: "127.0.0.1",
    port: NEXT_PORT,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };

  const proxyReq = http.request(options);
  proxyReq.on("upgrade", (proxyRes, proxySocket, proxyHead) => {
    socket.write(
      "HTTP/1.1 101 Switching Protocols\r\n" +
      Object.entries(proxyRes.headers).map(([k, v]) => `${k}: ${v}`).join("\r\n") +
      "\r\n\r\n"
    );
    proxySocket.pipe(socket);
    socket.pipe(proxySocket);
  });
  proxyReq.on("error", () => socket.destroy());
  proxyReq.end();
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[proxy] Loading page on port ${PORT}, starting Next.js on port ${NEXT_PORT}...`);

  const next = spawn("npx", ["next", "dev", "-p", String(NEXT_PORT), "-H", "0.0.0.0"], {
    stdio: "inherit",
    env: { ...process.env, PORT: String(NEXT_PORT) },
  });

  next.on("exit", (code) => {
    console.log(`[proxy] Next.js exited with code ${code}`);
    process.exit(code || 1);
  });

  async function waitForNext() {
    for (let i = 0; i < 60; i++) {
      try {
        await new Promise((resolve, reject) => {
          const r = http.get(`http://127.0.0.1:${NEXT_PORT}/`, (res) => {
            let data = "";
            res.on("data", (d) => (data += d));
            res.on("end", () => resolve(res.statusCode));
          });
          r.on("error", reject);
          r.setTimeout(5000, () => { r.destroy(); reject(new Error("timeout")); });
        });
        nextReady = true;
        console.log("[proxy] Next.js ready, pre-warming pages...");
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    if (!nextReady) {
      console.log("[proxy] Next.js failed to start");
      process.exit(1);
    }

    const warmPages = ["/", "/w/aestimamus/login", "/arag-bdp/gate"];
    for (const page of warmPages) {
      try {
        await new Promise((resolve, reject) => {
          const r = http.get(`http://127.0.0.1:${NEXT_PORT}${page}`, (res) => {
            let d = "";
            res.on("data", (c) => (d += c));
            res.on("end", () => { console.log(`[proxy] Warmed ${page} → ${res.statusCode}`); resolve(); });
          });
          r.on("error", reject);
          r.setTimeout(30000, () => { r.destroy(); reject(new Error("timeout")); });
        });
      } catch (e) {
        console.log(`[proxy] Failed to warm ${page}: ${e.message}`);
      }
    }

    await new Promise((r) => setTimeout(r, 500));
    pagesWarmed = true;
    console.log("[proxy] All pages warmed, proxying traffic to Next.js");
  }

  waitForNext();
});
