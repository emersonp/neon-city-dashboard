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

  // The page's look: the player's Day or Night (wa-light or wa-dark on <html>), or the Network's while anything says
  // the page is in it (the network class, one look for day and night, so it's always on wa-dark underneath). What can
  // say so: the character open in the Character tab (roster.js) and the Administrator's running scene (scene-runner.js).
  root.NCD_SKIN = (() => {
    const html = root.document?.documentElement;
    const sources = new Set();
    let dark = true;
    function apply() {
      if (!html) return;
      const network = sources.size > 0;
      html.classList.toggle("network", network);
      html.classList.toggle("wa-dark", network || dark);
      html.classList.toggle("wa-light", !network && !dark);
    }
    return {
      get dark() { return dark; },
      get network() { return sources.size > 0; },
      // The player's own theme, kept underneath the Network's.
      setDark(on) { dark = Boolean(on); apply(); },
      // source ("character", "scene") saying whether it's in the Network.
      set(source, on) { on ? sources.add(source) : sources.delete(source); apply(); },
    };
  })();

  root.NCD_UTIL = {
    $: (id) => document.getElementById(id),
    // A form control's value as trimmed text.
    text: (v) => String(v ?? "").trim(),
    escapeHTML: (s) => String(s ?? "").replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`),
  };
})(globalThis);
