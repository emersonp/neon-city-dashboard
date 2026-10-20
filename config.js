// Shared by everyone who uses this copy of the dashboard; nothing secret goes here.
// The Discord webhook is pasted into Settings instead, and stays in each browser.
window.NCD_CONFIG = {
  // Where the site is published (like https://you.github.io/neon-city-dashboard/). Discord loads character
  // portraits from here. Not needed on GitHub Pages itself; without it, local copies post without portraits.
  publicUrl: "https://emersonp.github.io/neon-city-dashboard/",
  // Inline Boon / Drawback / Influence icons in Discord: any server emoji works (emoji/ has PNGs if you need them).
  // Send \:boon: in Discord and paste what it prints (like <:boon:123...>).
  // Leave Boon / Drawback blank to show words instead; leave Influence blank for no icon.
  emoji: {
    boon: "<:boon:598512903741636609>",
    drawback: "<:drawback:598512919101177856>",
    influence: "<:ncd_influence:1561707702600867924>",
  },
};
