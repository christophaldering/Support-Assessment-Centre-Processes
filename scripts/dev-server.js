const http = require("http");
const { spawn } = require("child_process");

const PORT = 5000;
const NEXT_PORT = 5001;
let nextReady = false;

const loadingHTML = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Executive Diagnostics Suite</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,-apple-system,sans-serif;background:#0f172a;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh}
.c{text-align:center}
.s{width:36px;height:36px;border:3px solid rgba(255,255,255,0.2);border-top-color:#3b82f6;border-radius:50%;animation:r .7s linear infinite;margin:0 auto 1.5rem}
@keyframes r{to{transform:rotate(360deg)}}
h2{font-size:1rem;font-weight:500;opacity:.9;margin-bottom:.5rem}
p{font-size:.8rem;opacity:.5}
</style>
</head>
<body>
<div class="c">
<div class="s"></div>
<h2>Anwendung wird gestartet</h2>
<p>Bitte einen Moment warten...</p>
</div>
<script>
var c=0;
function p(){
fetch(window.location.href,{method:'HEAD',cache:'no-store'}).then(function(r){
if(r.headers.get('x-app-ready')==='1'){window.location.reload()}
else{c++;if(c<60)setTimeout(p,2000)}
}).catch(function(){c++;if(c<60)setTimeout(p,2000)})
}
setTimeout(p,2000);
</script>
</body>
</html>`;

function proxyRequest(req, res) {
  const options = {
    hostname: "127.0.0.1",
    port: NEXT_PORT,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    proxyRes.headers["x-app-ready"] = "1";
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on("error", () => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(loadingHTML);
  });

  req.pipe(proxyReq);
}

const server = http.createServer((req, res) => {
  if (nextReady) {
    proxyRequest(req, res);
    return;
  }

  if (req.method === "HEAD") {
    res.writeHead(200);
    res.end();
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store, no-cache, must-revalidate",
  });
  res.end(loadingHTML);
});

server.on("upgrade", (req, socket, head) => {
  if (!nextReady) {
    socket.destroy();
    return;
  }

  const options = {
    hostname: "127.0.0.1",
    port: NEXT_PORT,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };

  const proxyReq = http.request(options);
  proxyReq.on("upgrade", (proxyRes, proxySocket) => {
    socket.write(
      "HTTP/1.1 101 Switching Protocols\r\n" +
        Object.entries(proxyRes.headers)
          .map(([k, v]) => `${k}: ${v}`)
          .join("\r\n") +
        "\r\n\r\n"
    );
    proxySocket.pipe(socket);
    socket.pipe(proxySocket);
  });
  proxyReq.on("error", () => socket.destroy());
  proxyReq.end();
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[proxy] Listening on port ${PORT}, starting Next.js...`);

  const next = spawn("npx", ["next", "dev", "-p", String(NEXT_PORT), "-H", "0.0.0.0"], {
    stdio: "inherit",
    env: { ...process.env, PORT: String(NEXT_PORT), NEXT_TELEMETRY_DISABLED: "1" },
  });

  next.on("exit", (code) => {
    console.log(`[proxy] Next.js exited with code ${code}`);
    process.exit(code || 1);
  });

  async function waitForNext() {
    for (let i = 0; i < 120; i++) {
      try {
        await new Promise((resolve, reject) => {
          const r = http.get(`http://127.0.0.1:${NEXT_PORT}/`, (res) => {
            let data = "";
            res.on("data", (d) => (data += d));
            res.on("end", () => resolve(res.statusCode));
          });
          r.on("error", reject);
          r.setTimeout(10000, () => { r.destroy(); reject(new Error("timeout")); });
        });
        nextReady = true;
        console.log("[proxy] Next.js ready, proxying traffic");
        return;
      } catch {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
    console.log("[proxy] Next.js failed to start after 120s");
    process.exit(1);
  }

  waitForNext();
});
