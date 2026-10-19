// Copy this file to config.js (which git ignores) and paste your Discord webhook URL.
// Once the Settings tab can save a webhook, that saved value takes priority over this one.
window.NCD_CONFIG = {
  webhookUrl: "https://discord.com/api/webhooks/<id>/<token>",
  // Inline Boon / Drawback / Influence icons in Discord: any server emoji works (emoji/ has PNGs if you need them).
  // Send \:boon: in Discord and paste what it prints (like <:boon:123...>).
  // Leave Boon / Drawback blank to show words instead; leave Influence blank for no icon.
  emoji: {
    boon: "",
    drawback: "",
    influence: "",
  },
};
