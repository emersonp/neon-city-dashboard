# Neon City Dashboard

A static page for Neon City games: dice rolls posted to Discord, with a roster and settings to come.
Built with [Web Awesome](https://webawesome.com) (free, from its CDN). No build step.

## Run it

1. Copy `config.example.js` to `config.js` and paste in your Discord webhook URL.
   `config.js` is git-ignored, so the webhook never ends up in the repo.
2. Open `index.html` in a browser, or serve the folder (for example `npx serve` or `python -m http.server`).

Anyone who has the webhook URL can post to that channel. Don't host a copy online with the URL baked in.

## Dice rules

Same as neon-city-overlay:

- **d100**: a tens d10 and a ones d10. `00` + `0` counts as 100.
- **Target (optional)**: a total at or under the target succeeds; over it fails. No target, no verdict.
- **Advantage dice** (0-4): d8 with 4 Boon faces and 4 blanks (50% each).
- **Challenge dice** (0-4): d10 with 6 Drawback faces and 4 blanks (60% each).
- Boons and Drawbacks **cancel one for one**; whatever is left over is the result.
- The target sticks between rolls; the dice pools reset to 0 after every roll.

Press <kbd>R</kbd> on the Dice tab to roll.

## Tests

```
node --test tests/dice.test.cjs
```

## What's here

| File | Purpose |
| --- | --- |
| `index.html` | Page shell: header, theme toggle, Dice / Roster / Settings tabs |
| `styles.css` | Light cyberpunk accents on top of the Web Awesome default theme |
| `app.js` | Theme, tabs, the roller and result panel, and the Discord style lab |
| `dice.js` | Dice rules (no page code, so it's testable in Node) |
| `discord.js` | Discord message styles and the webhook sender |
| `icons.js`, `icons/` | Game icons (advantage die, challenge die, boon, drawback, heat, influence) |

Things remembered in localStorage (all under `ncd.`): theme, the last tab, the target number, the last roll, the chosen message style, and the custom-name toggle.
A `ncd.webhook` value, once Settings can save one, takes priority over `config.js`.

## Discord message styles

Every roll is posted in whichever style is picked. **Roll and send every style** posts one roll in all six so you can compare them in the channel:

- **Plain**: just text.
- **Markdown**: `-#` subtext and `##` headings give a small / big / small layout. Works on mobile.
- **Embed**: colored side bar, author line, title, footer, timestamp, and an uploaded thumbnail.
- **Embed + fields**: inline fields for dice, total, target, boons, drawbacks, and net.
- **Components**: Discord's newer layout blocks (container, accent color, a section with a thumbnail, divider).
  This needs `?with_components=true` on the webhook URL.
- **ANSI color**: a colored code block. Desktop only; mobile shows it uncolored.

The thumbnail is the leftover Boon or Drawback icon (none if nothing is left), drawn onto a canvas and uploaded as a PNG, since Discord doesn't display SVGs.
Colors: green for success, red for failure, cyan when there's no target.
