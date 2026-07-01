import { describe, it, expect } from "vitest";
import { sanitizeRichText } from "@/lib/sanitize";

describe("sanitizeRichText", () => {
  it("erlaubte Tags bleiben erhalten: fett, Absatz", () => {
    const input = "<p><strong>Fett</strong></p>";
    const result = sanitizeRichText(input);
    expect(result).toContain("<strong>");
    expect(result).toContain("Fett");
    expect(result).toContain("<p>");
  });

  it("Listen werden nicht entfernt", () => {
    const input = "<ul><li>Punkt A</li><li>Punkt B</li></ul>";
    const result = sanitizeRichText(input);
    expect(result).toContain("<ul>");
    expect(result).toContain("<li>");
    expect(result).toContain("Punkt A");
  });

  it("Überschriften bleiben erhalten", () => {
    const input = "<h2>Titel</h2><p>Text</p>";
    const result = sanitizeRichText(input);
    expect(result).toContain("<h2>");
    expect(result).toContain("Titel");
  });

  it("<script>-Tag wird entfernt/neutralisiert", () => {
    const input = '<p>Text</p><script>alert("xss")</script>';
    const result = sanitizeRichText(input);
    expect(result).not.toContain("<script>");
    expect(result).not.toContain("alert(");
    expect(result).toContain("Text");
  });

  it("onclick-Attribut wird entfernt", () => {
    const input = '<p onclick="alert(1)">Klick mich</p>';
    const result = sanitizeRichText(input);
    expect(result).not.toContain("onclick");
    expect(result).toContain("Klick mich");
  });

  it("onerror-Attribut wird entfernt", () => {
    const input = '<img src="x" onerror="alert(1)">';
    const result = sanitizeRichText(input);
    expect(result).not.toContain("onerror");
  });

  it("javascript:-URL wird entfernt/neutralisiert", () => {
    const input = '<a href="javascript:alert(1)">Link</a>';
    const result = sanitizeRichText(input);
    expect(result).not.toContain("javascript:");
    expect(result).toContain("Link");
  });

  it("leerer String bleibt leer", () => {
    expect(sanitizeRichText("")).toBe("");
  });

  it("reiner Text ohne Tags bleibt erhalten", () => {
    const result = sanitizeRichText("Hallo Welt");
    expect(result).toContain("Hallo Welt");
  });
});
