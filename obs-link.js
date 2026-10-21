// Minimal obs-websocket v5 client (from neon-city-overlay). Messages are relayed between pages with
// BroadcastCustomEvent, so OBS itself acts as the "backend". Settings come from obs-config.js, which is
// gitignored; without it (on GitHub Pages, say) NCD_OBS_LINK.config is null and nothing connects.
(function () {
  const cfg = window.NCD_OBS_CONFIG
    ? Object.assign({ host: "localhost", port: 4455, password: "", side: "left" }, window.NCD_OBS_CONFIG)
    : null;

  // Pure-JS SHA-256 (crypto.subtle isn't available on OBS's http://absolute/ local-file pages).
  function sha256(msg) {
    const K = [], H = [];
    const frac = (x) => ((x - Math.floor(x)) * 4294967296) | 0;
    for (let n = 2, found = 0; found < 64; n++) {
      let prime = true;
      for (let i = 2; i * i <= n; i++) if (n % i === 0) { prime = false; break; }
      if (prime) {
        if (found < 8) H[found] = frac(Math.sqrt(n));
        K[found++] = frac(Math.cbrt(n));
      }
    }
    const len = msg.length;
    const buf = new Uint8Array(((len + 9 + 63) >> 6) << 6);
    buf.set(msg);
    buf[len] = 0x80;
    const dv = new DataView(buf.buffer);
    dv.setUint32(buf.length - 4, (len * 8) >>> 0);
    dv.setUint32(buf.length - 8, Math.floor((len * 8) / 4294967296));
    const W = new Int32Array(64);
    const rotr = (x, r) => (x >>> r) | (x << (32 - r));
    for (let off = 0; off < buf.length; off += 64) {
      for (let i = 0; i < 16; i++) W[i] = dv.getInt32(off + i * 4);
      for (let i = 16; i < 64; i++) {
        const s0 = rotr(W[i - 15], 7) ^ rotr(W[i - 15], 18) ^ (W[i - 15] >>> 3);
        const s1 = rotr(W[i - 2], 17) ^ rotr(W[i - 2], 19) ^ (W[i - 2] >>> 10);
        W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0;
      }
      let [a, b, c, d, e, f, g, h] = H;
      for (let i = 0; i < 64; i++) {
        const t1 = (h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + W[i]) | 0;
        const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      [a, b, c, d, e, f, g, h].forEach((v, i) => (H[i] = (H[i] + v) | 0));
    }
    const out = new Uint8Array(32);
    const odv = new DataView(out.buffer);
    H.forEach((v, i) => odv.setInt32(i * 4, v));
    return out;
  }

  const enc = new TextEncoder();
  const b64 = (bytes) => btoa(String.fromCharCode.apply(null, bytes));
  const authString = (pw, salt, challenge) =>
    b64(sha256(enc.encode(b64(sha256(enc.encode(pw + salt))) + challenge)));

  // onMessage(data) gets payloads sent by other pages; onStatus(state, detail) reports
  // "connecting" | "connected" | "disconnected" | "error".
  function connect({ onMessage, onStatus }) {
    let ws, ready = false, reqId = 0, retry, closed = false;
    const status = (s, detail) => onStatus && onStatus(s, detail);

    function open() {
      status("connecting");
      try {
        ws = new WebSocket(`ws://${cfg.host}:${cfg.port}`);
      } catch (e) {
        schedule();
        return;
      }
      ws.onmessage = (ev) => {
        let msg;
        try { msg = JSON.parse(ev.data); } catch { return; }
        if (msg.op === 0) {
          const d = { rpcVersion: 1, eventSubscriptions: 1 }; // General events only (CustomEvent)
          const auth = msg.d.authentication;
          if (auth) d.authentication = authString(cfg.password, auth.salt, auth.challenge);
          ws.send(JSON.stringify({ op: 1, d }));
        } else if (msg.op === 2) {
          ready = true;
          status("connected");
        } else if (msg.op === 5 && msg.d.eventType === "CustomEvent") {
          const data = msg.d.eventData;
          if (data && data.app === "nco") onMessage && onMessage(data);
        }
      };
      ws.onclose = (ev) => {
        ready = false;
        if (closed) return;
        if (ev.code === 4009) status("error", "Wrong OBS WebSocket password — check obs-config.js");
        else status("disconnected", "Can't reach OBS WebSocket — is OBS open with the server enabled?");
        schedule();
      };
    }

    function schedule() {
      clearTimeout(retry);
      if (closed) return;
      retry = setTimeout(open, 3000);
    }

    open();
    return {
      // stops for good: no more retries or status reports
      close() {
        closed = true;
        ready = false;
        clearTimeout(retry);
        if (ws) ws.close();
      },
      send(data) {
        if (!ready) return false;
        ws.send(JSON.stringify({
          op: 6,
          d: {
            requestType: "BroadcastCustomEvent",
            requestId: "nco-" + ++reqId,
            requestData: { eventData: Object.assign({ app: "nco" }, data) },
          },
        }));
        return true;
      },
    };
  }

  window.NCD_OBS_LINK = { config: cfg, connect, _sha256: sha256 };
})();
