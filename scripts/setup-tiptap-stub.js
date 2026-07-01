/**
 * Creates a minimal stub for @tiptap/extension-pcompraph which does not exist
 * in the npm registry but is listed as a transitive dependency of tiptap v3
 * packages. The stub satisfies npm's dependency resolution without providing
 * any runtime functionality (the package is not actually used at runtime).
 *
 * This runs as a `preinstall` npm lifecycle script so the stub exists before
 * npm tries to fetch the package from the registry.
 */
const fs = require("fs");
const path = require("path");

const stubDir = path.join(
  process.cwd(),
  "node_modules",
  "@tiptap",
  "extension-pcompraph"
);

try {
  fs.mkdirSync(stubDir, { recursive: true });
  fs.writeFileSync(
    path.join(stubDir, "package.json"),
    JSON.stringify(
      {
        name: "@tiptap/extension-pcompraph",
        version: "3.19.0",
        description: "Stub — package does not exist in npm registry",
        main: "index.js",
      },
      null,
      2
    )
  );
  fs.writeFileSync(path.join(stubDir, "index.js"), "module.exports = {};\n");
  console.log("[setup-tiptap-stub] Stub for @tiptap/extension-pcompraph ready");
} catch (e) {
  console.warn("[setup-tiptap-stub] Warning:", e.message);
}
