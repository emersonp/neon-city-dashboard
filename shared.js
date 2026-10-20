// Shared by the page scripts: storage, who's playing, and small helpers. Loaded in <head>, before anything paints.
(function (root) {
  // localStorage can be missing or throw (private windows, blocked storage); never let that break the page.
  // Keys are stored under "ncd.". `raw` is localStorage itself (or null), for NCD_CHARACTERS.load/save.
  const raw = (() => { try { return root.localStorage ?? null; } catch { return null; } })();
  root.NCD_STORE = {
    raw,
    get(key, fallback = null) { try { return raw.getItem(`ncd.${key}`) ?? fallback; } catch { return fallback; } },
    // null removes the key.
    set(key, value) { try { value == null ? raw.removeItem(`ncd.${key}`) : raw.setItem(`ncd.${key}`, value); } catch {} },
  };

  // Who's playing. Settings (app.js) fills in the player and GM; roster.js sets the character open in the Character tab.
  root.NCD_SESSION = { playerName: "", gm: false, character: null };

  root.NCD_UTIL = {
    $: (id) => document.getElementById(id),
    // A form control's value as trimmed text.
    text: (v) => String(v ?? "").trim(),
    escapeHTML: (s) => String(s ?? "").replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`),
  };
})(globalThis);
