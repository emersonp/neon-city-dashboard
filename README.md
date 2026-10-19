# Neon City Dashboard

A static page for Neon City games: dice rolls posted to Discord, a rules cheat sheet, a character roster, and player settings.
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
node --test tests/dice.test.cjs tests/discord.test.cjs tests/characters.test.cjs
```

## What's here

| File | Purpose |
| --- | --- |
| `index.html` | Page shell: header, theme toggle, tabs, and the dialogs |
| `styles.css` | Light cyberpunk accents on top of the Web Awesome default theme |
| `app.js` | Theme, tabs, the roller and result panel, and posting to Discord |
| `dice.js` | Dice rules (no page code, so it's testable in Node) |
| `characters.js` | Archetypes, origins, random handles and names, saving characters (testable in Node) |
| `roster.js` | Roster tab and the Character tab |
| `docs/character-sheet.md` | Markdown version of the paper character sheet |
| `discord.js` | Builds the Discord message and posts it to the webhook |
| `emoji/` | Boon and Drawback PNGs to upload as Discord server emoji |
| `icons.js`, `icons/` | Game icons (advantage die, challenge die, boon, drawback, heat, influence) |

Things remembered in localStorage (all under `ncd.`): characters, the open character, player name, GM toggle, theme, the last tab, the target number, and the last roll.
A `ncd.webhook` value, once Settings can save one, takes priority over `config.js`.

## Discord messages

Every roll posts one message built from Discord's layout components: a container whose accent bar is
green for success, red for failure, and cyan when there's no target, holding three lines:

```
-# Parker rolled against 45 and got a
## Success! 32 · [boon]
-# Luck: 94 · Influence: 2 · Rolled: [boon] [boon] [drawback]
```

The player name comes from **Settings** ("Player" if blank). The footer shows the Current Luck and Current Influence of
the character open in the Character tab (neither if no character is open), except for the **Administrator (GM)**,
whose rolls leave them out. Messages post as that character's handle, as "Administrator" for the GM, or as "Neon City Dashboard" with no
character open. `Rolled:` lists every Boon and
Drawback that came up, before cancelling, and is left out when none did. A GM roll with no symbols has no footer.

Skill rolls from a running character (Character tab → **Run**, then click a skill) name the skill:
`Parker rolled *Shoot Someone* against 75 and got a` (the skill in italics). The roll dialog starts at the skill's value and intrinsic dice.

Changing Influence with the −1 / +1 buttons while running posts a one-line message, like
`Parker gained an Influence.` or `Parker spent an Influence.`, followed by the Influence emoji if one is set, then how much is left (`2 remaining.`).
Changes made in Edit aren't posted. No message ever pings anyone.

### Character portraits

Portraits live in `portraits/`. To add one, put the image there (a 256×256 square works best) and add its file
name to `portraits/portraits.js`; it then shows up in the Portrait picker when editing a character. Characters
without one use `portraits/default.png`.

Discord shows the portrait as the message's avatar, but it has to load the image from a public link. On GitHub Pages
that's automatic. A local copy sends no avatar unless `publicUrl` in `config.js` points at the published site.

### Inline Boon / Drawback / Influence icons

The icons are custom server emoji, which is the only way to put an image inline in a Discord message.

1. Have Boon, Drawback, and Influence emoji on the server. Any names work; `emoji/` has PNGs to upload
   (**Server Settings → Emoji → Upload Emoji**) if you need them.
2. In any channel, send the emoji names with a backslash, like `\:boon:`, `\:drawback:`, and `\:influence:`.
   Discord replies with codes like `<:boon:1234567890>`.
3. Paste those codes into `emoji` in `config.js`.

Until then, messages use words ("with two boons"), and Influence messages have no icon.
