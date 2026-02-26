const { spawn } = require("child_process");

const next = spawn("npx", ["next", "dev", "-p", "5000", "-H", "0.0.0.0"], {
  stdio: "inherit",
  env: { ...process.env, PORT: "5000", NEXT_TELEMETRY_DISABLED: "1" },
});

next.on("exit", (code) => process.exit(code || 1));
process.on("SIGTERM", () => next.kill("SIGTERM"));
process.on("SIGINT", () => next.kill("SIGINT"));
