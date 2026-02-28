export type Lang = "de" | "en";

const COOKIE_NAME = "lang";
const LS_KEY = "comp_lang";

export function getLang(): Lang {
  if (typeof window === "undefined") return "de";
  try {
    const cookie = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${COOKIE_NAME}=`));
    if (cookie) {
      const v = cookie.split("=")[1];
      if (v === "en" || v === "de") return v;
    }
  } catch {}
  try {
    const ls = localStorage.getItem(LS_KEY);
    if (ls === "en" || ls === "de") return ls;
  } catch {}
  return "de";
}

export function setLang(lang: Lang) {
  try {
    document.cookie = `${COOKIE_NAME}=${lang};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
  } catch {}
  try {
    localStorage.setItem(LS_KEY, lang);
  } catch {}
}
