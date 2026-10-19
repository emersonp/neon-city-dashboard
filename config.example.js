// Copy this file to config.js (which git ignores). The Discord webhook can go here or in Settings;
// one saved in Settings takes priority over this one.
window.NCD_CONFIG = {
  webhookUrl: "https://discord.com/api/webhooks/<id>/<token>",
  // Where the site is published (like https://you.github.io/neon-city-dashboard/). Discord loads character
  // portraits from here. Not needed on GitHub Pages itself; without it, local copies post without portraits.
  publicUrl: "",
  // Inline Boon / Drawback / Influence icons in Discord: any server emoji works (emoji/ has PNGs if you need them).
  // Send \:boon: in Discord and paste what it prints (like <:boon:123...>).
  // Leave Boon / Drawback blank to show words instead; leave Influence blank for no icon.
  emoji: {
    boon: "",
    drawback: "",
    influence: "",
  },
};
