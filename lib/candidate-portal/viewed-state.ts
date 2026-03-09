"use client";

const STORAGE_KEY = "candidate-portal-viewed-docs";

function getViewedSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveViewedSet(set: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

export function markDocumentViewed(docSlug: string): void {
  const set = getViewedSet();
  set.add(docSlug);
  saveViewedSet(set);
}

export function isDocumentViewed(docSlug: string): boolean {
  return getViewedSet().has(docSlug);
}

export function getViewedDocumentSlugs(): string[] {
  return Array.from(getViewedSet());
}

export function getViewedCount(): number {
  return getViewedSet().size;
}
