const fs = require("fs");
const path = require("path");

const distDir = path.join(__dirname, "..", "dist");
const publicDir = path.join(distDir, "public");

if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

const standaloneDir = path.join(__dirname, "..", ".next", "standalone");
const staticSrc = path.join(__dirname, "..", ".next", "static");
const staticDest = path.join(standaloneDir, ".next", "static");
const publicSrc = path.join(__dirname, "..", "public");
const publicDest = path.join(standaloneDir, "public");

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const item of fs.readdirSync(src)) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    if (fs.statSync(srcPath).isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyRecursive(staticSrc, staticDest);
copyRecursive(publicSrc, publicDest);

const wrapper = `
const path = require("path");
process.env.PORT = process.env.PORT || "5000";
process.env.HOSTNAME = "0.0.0.0";
process.chdir(path.join(__dirname, "..", ".next", "standalone"));
require(path.join(__dirname, "..", ".next", "standalone", "server.js"));
`;

fs.writeFileSync(path.join(distDir, "index.cjs"), wrapper.trim());
console.log("Deploy preparation complete: dist/index.cjs created");
