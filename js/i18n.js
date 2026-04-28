/**
 * i18n.js — Language switching engine
 * Loads en.json/ja.json, applies translations via data-i18n attributes,
 * persists preference in localStorage.
 */
const I18n = (() => {
  const STORAGE_KEY = "lang";
  const DEFAULT_LANG = "en";
  const SUPPORTED = ["en", "ja"];

  let currentLang = DEFAULT_LANG;
  let strings = {};
  const listeners = [];

  function getSavedLang() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return SUPPORTED.includes(saved) ? saved : DEFAULT_LANG;
  }

  function resolve(obj, path) {
    return path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), obj);
  }

  async function loadStrings(lang) {
    const res = await fetch(`data/i18n/${lang}.json`);
    return res.json();
  }

  function applyToDOM() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const value = resolve(strings, key);
      if (value !== undefined) {
        if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
          el.placeholder = value;
        } else {
          el.textContent = value;
        }
      }
    });
    document.documentElement.lang = currentLang;
  }

  function notifyListeners() {
    listeners.forEach((fn) => fn(currentLang));
  }

  async function init() {
    currentLang = getSavedLang();
    strings = await loadStrings(currentLang);
    applyToDOM();
    notifyListeners();
  }

  async function setLang(lang) {
    if (!SUPPORTED.includes(lang)) return;
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    strings = await loadStrings(lang);
    applyToDOM();
    notifyListeners();
  }

  function toggle() {
    const next = currentLang === "en" ? "ja" : "en";
    return setLang(next);
  }

  function lang() {
    return currentLang;
  }

  /** Resolve a bilingual field { en: "...", ja: "..." } */
  function localize(field) {
    if (!field) return "";
    if (typeof field === "string") return field;
    return field[currentLang] || field["en"] || "";
  }

  function onChange(fn) {
    listeners.push(fn);
  }

  return { init, setLang, toggle, lang, localize, onChange };
})();
