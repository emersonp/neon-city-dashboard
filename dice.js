// Neon City dice rules (same as neon-city-overlay):
// - d100 = tens d10 + ones d10, where 00 + 0 counts as 100
// - optional target: total <= target succeeds, otherwise fails
// - Advantage die: d8 with 4 Boon faces + 4 blanks (50%)
// - Challenge die: d10 with 6 Drawback faces + 4 blanks (60%)
// - Boons and Drawbacks cancel one for one
// - optional impact (a weapon's damage, a kit's bonus): a success's impact is the total plus it
(function (root) {
  const MAX_POOL = 4;

  const rand10 = () => {
    if (root.crypto?.getRandomValues) {
      const a = new Uint8Array(1);
      do { root.crypto.getRandomValues(a); } while (a[0] >= 250); // avoid modulo bias
      return a[0] % 10;
    }
    return Math.floor(Math.random() * 10);
  };

  const clampPool = (n) => Math.max(0, Math.min(MAX_POOL, Math.trunc(Number(n) || 0)));
  const fmtTens = (tens) => (tens === 0 ? "00" : String(tens * 10));
  // A whole number above zero, or null.
  const cleanImpact = (n) => (n == null || n === "" ? null : Number.isInteger(Number(n)) && Number(n) > 0 ? Number(n) : null);

  // `rng` returns a d10 result (0-9); every die, including the d8, is read off one.
  function roll({ target = null, advantage = 0, challenge = 0, impact = null } = {}, rng = rand10) {
    const tens = rng(), ones = rng();
    const total = tens * 10 + ones || 100;
    const adv = Array.from({ length: clampPool(advantage) }, () => rng() % 2 === 0);
    const chal = Array.from({ length: clampPool(challenge) }, () => rng() < 6);
    const boons = adv.filter(Boolean).length;
    const drawbacks = chal.filter(Boolean).length;
    const success = target == null ? null : total <= Number(target);
    return {
      tens, ones, total,
      target: target == null ? null : Number(target),
      success,
      impact: success && cleanImpact(impact) ? total + cleanImpact(impact) : null, // only on a success
      adv, chal, boons, drawbacks,
      net: boons - drawbacks,               // > 0 Boons left, < 0 Drawbacks left
      cancelled: Math.min(boons, drawbacks), // pairs that cancelled out
      at: Date.now(),
    };
  }

  root.NCD_DICE = { MAX_POOL, clampPool, cleanImpact, rand10, roll, fmtTens };
})(globalThis);
