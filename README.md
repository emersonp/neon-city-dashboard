# Neon City Dashboard

A static page for Neon City games: dice rolls posted to Discord, with a roster and settings to come.
Built with [Web Awesome](https://webawesome.com) (free, from its CDN). No build step.

## Run it

1. Copy `config.example.js` to `config.js` and paste in your Discord webhook URL.
   `config.js` is git-ignored, so the webhook never ends up in the repo.
2. Open `index.html` in a browser, or serve the folder (for example `npx serve` or `python -m http.server`).

Anyone who has the webhook URL can post to that channel. Don't host a copy online with the URL baked in.

## What's here

| File | Purpose |
| --- | --- |
| `index.html` | Page shell: header, theme toggle, Dice / Roster / Settings tabs |
| `styles.css` | Light cyberpunk accents on top of the Web Awesome default theme |
| `app.js` | Theme, tabs, and the Dice tab's style lab |
| `discord.js` | Discord message styles and the webhook sender |
| `icons.js`, `icons/` | Game icons (advantage die, challenge die, boon, drawback, heat, influence) |

Things remembered in localStorage (all under `ncd.`): theme, the last tab, the chosen message style, and the custom-name toggle.
A `ncd.webhook` value, once Settings can save one, takes priority over `config.js`.

## Discord message styles

The Dice tab sends a made-up sample roll in whichever style you pick, so you can compare them in the channel:

- **Plain**: just text.
- **Markdown**: `-#` subtext and `##` headings give a small / big / small layout. Works on mobile.
- **Embed**: colored side bar, author line, title, footer, timestamp, and an uploaded thumbnail.
- **Embed + fields**: adds a description and inline stat fields.
- **Components**: Discord's newer layout blocks (container, accent color, a section with a thumbnail, divider).
  This needs `?with_components=true` on the webhook URL.
- **ANSI color**: a colored code block. Desktop only; mobile shows it uncolored.

The thumbnail is drawn from the game icon onto a canvas and uploaded as a PNG, since Discord doesn't display SVGs.
