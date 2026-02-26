const http = require("http");
const { spawn } = require("child_process");

const PROXY_PORT = 5000;
const NEXT_PORT = 5001;
let nextReady = false;

const server = http.createServer((req, res) => {
  if (!nextReady) {
    if (req.method === "HEAD" || req.url === "/api/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end('{"status":"starting"}');
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<html><body><h2>Starting...</h2><script>setTimeout(()=>location.reload(),3000)</script></body></html>");
    return;
  }

  const opts = {
    hostname: "127.0.0.1",
    port: NEXT_PORT,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };

  const proxy = http.request(opts, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  proxy.on("error", () => {
    res.writeHead(502);
    res.end("Bad Gateway");
  });
  req.pipe(proxy);
});

server.on("upgrade", (req, socket, head) => {
  if (!nextReady) { socket.destroy(); return; }
  const opts = {
    hostname: "127.0.0.1",
    port: NEXT_PORT,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };
  const proxy = http.request(opts);
  proxy.on("upgrade", (proxyRes, proxySocket) => {
    socket.write(
      "HTTP/1.1 101 Switching Protocols\r\n" +
      Object.entries(proxyRes.headers).map(([k,v]) => `${k}: ${v}`).join("\r\n") +
      "\r\n\r\n"
    );
    proxySocket.pipe(socket);
    socket.pipe(proxySocket);
  });
  proxy.on("error", () => socket.destroy());
  proxy.end();
});

server.listen(PROXY_PORT, "0.0.0.0", () => {
  console.log(`[proxy] Ready on port ${PROXY_PORT}`);

  const next = spawn("npx", ["next", "dev", "-p", String(NEXT_PORT), "-H", "0.0.0.0"], {
    stdio: "inherit",
    env: { ...process.env, PORT: String(NEXT_PORT), NEXT_TELEMETRY_DISABLED: "1" },
  });

  next.on("exit", (code) => {
    console.log(`[proxy] Next.js exited (${code})`);
    process.exit(code || 1);
  });

  function check() {
    const r = http.get(`http://127.0.0.1:${NEXT_PORT}/`, (res) => {
      let d = "";
      res.on("data", c => d += c);
      res.on("end", () => {
        if (res.statusCode === 200) {
          nextReady = true;
          console.log("[proxy] Next.js ready, proxying all traffic");
        } else {
          setTimeout(check, 1000);
        }
      });
    });
    r.on("error", () => setTimeout(check, 1000));
    r.setTimeout(15000, () => { r.destroy(); setTimeout(check, 1000); });
  }

  setTimeout(check, 2000);
});

process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));
