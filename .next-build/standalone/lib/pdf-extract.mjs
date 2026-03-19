import fs from "fs";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

async function main() {
  const filePath = process.argv[2];
  if (!filePath || !fs.existsSync(filePath)) {
    process.stdout.write(JSON.stringify({ error: "File not found" }));
    process.exit(1);
  }

  try {
    const data = new Uint8Array(fs.readFileSync(filePath));
    const doc = await getDocument({ data, useSystemFonts: true }).promise;
    const textParts = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .filter(item => "str" in item)
        .map(item => item.str)
        .join(" ");
      if (pageText.trim()) {
        textParts.push(pageText);
      }
    }
    process.stdout.write(JSON.stringify({ text: textParts.join("\n\n") }));
  } catch (err) {
    process.stdout.write(JSON.stringify({ error: err.message || "Parse failed" }));
    process.exit(1);
  }
}

main();
