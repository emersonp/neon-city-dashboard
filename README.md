# Neon City Dashboard

A static page for Neon City games: dice rolls posted to Discord, a rules cheat sheet, a gear and keyword reference, a character roster, and player settings.
Built with [Web Awesome](https://webawesome.com) (free, from its CDN). No build step.

## Run it

1. Open `index.html` in a browser, or serve the folder (for example `npx serve` or `python -m http.server`).
2. In **Settings**, enter a player name and paste the Discord webhook URL. Until both are set, the page opens on Settings.
   The webhook is saved only in that browser (OBS keeps its own storage: use the browser source's **Interact** window).

Anyone who has the webhook URL can post to that channel, so share it with your players privately. It's never in the repo,
so the site is safe to host on GitHub Pages.

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
node --test tests/dice.test.cjs tests/discord.test.cjs tests/characters.test.cjs tests/format.test.cjs tests/abilities.test.cjs tests/rules.test.cjs tests/databank.test.cjs tests/gear.test.cjs
```

## What's here

| File | Purpose |
| --- | --- |
| `index.html` | Page shell: header, theme toggle, tabs, and the dialogs |
| `styles.css` | Light cyberpunk accents on top of the Web Awesome default theme |
| `shared.js` | Loaded first: localStorage access, the session (player, GM, open character), small helpers |
| `app.js` | Theme, tabs, settings, the dice pools, the roller and result panel, and posting to Discord |
| `config.js` | Shared settings for everyone: Discord emoji codes and the published address (no webhook) |
| `dice.js` | Dice rules (no page code, so it's testable in Node) |
| `characters.js` | Archetypes, origins, random handles and names, gear items and conditions, Create's choices, saving characters (needs `dice.js`; testable in Node) |
| `roster.js` | Roster tab and the Character tab, including the condition chips and dialogs |
| `create.js` | Create mode: a new character built step by step from `rules.js` (step header, Back/Next/Finish, Discard, each step's controls) |
| `abilities.js` | The perk and augmentation catalog; edit it to add abilities |
| `rules.js` | Rulebook data for Create: archetype skills, initiative, knows, starting gear templates; origin options and augmentation gear (needs `characters.js`; testable in Node) |
| `databank.js` | The Databank tab's text from the rulebook's Equipment chapter: gear, tool sets, weapons, armor, vehicles, and gear and weapon keywords with their restrictions (testable in Node) |
| `gear.js` | Gear rules from `databank.js`: built-in keywords, which keywords an item can take, damage and impact, labels, rules text, and Create's starting gear (testable in Node) |
| `gear-ui.js` | Gear on the page: item rows, keyword chips, rules text, and the keyword picker the gear dialog and Create share |
| `format.js` | Turns ability descriptions into HTML: paragraphs, bold, italic, lists, icon tokens (testable in Node) |
| `docs/character-sheet.md` | Markdown version of the paper character sheet |
| `discord.js` | Builds the Discord message and posts it to the webhook |
| `emoji/` | Boon and Drawback PNGs to upload as Discord server emoji |
| `icons.js`, `icons/` | Game icons (advantage die, challenge die, boon, drawback, heat, influence) |

Things remembered in localStorage (all under `ncd.`): characters (with the ids of their perks and augmentations, their gear with its type and keywords, and the conditions on them and their gear), the open character, player name, GM toggle, webhook, theme, the last tab, the target number, and the last roll.

## Databank

The **Databank** tab is a reference for the rulebook's Equipment chapter, in four tabs: **Gear Basics** (gear
basics, guided skill software, tool kits, targeted stimulants, computer gear, biotechnology, and other tools),
**Armory** (weapons and body armor), **Garage** (vehicles), and **Keywords** (positive and negative gear keywords,
the random gear keywords table, and weapon keywords). It's all in
`databank.js`, written in the same format as ability descriptions (below). Each weapon lists the keywords it allows,
and each weapon keyword lists the weapons that allow it, both from the `allowed` lists in `databank.js`.
`tests/databank.test.cjs` checks the keyword tables against each other.

## Gear

A character's gear is a list of items. Each has a **name**, a **quantity** (shown as `×3` when above 1), a **type**, the
**keywords** added to it, and conditions (below). Everything about the types comes from `databank.js`, through `gear.js`:

| Type | What's picked | Shown as |
| --- | --- | --- |
| Weapon | a category from the Armory | `Pistol · 1h · +20` (hands and damage work out from the category and Jagged, Mounted, Miniaturized) |
| Kit | a tool set, its quality, optionally a skill it's hyper-specialized for, and whether it's consumable | `Kit · Paramedic's Kit · Standard · +20 impact` |
| Equipment | any other entry in Gear Basics (skill software, stimulants, computer gear, biotechnology, other tools), plus a skill or option when the entry needs one | `Equipment · Computer gear` |
| Armor | Armored x1 to x4; each level's keywords come with it | `Armor · Armored x2` |
| Vehicle | a vehicle from the Garage | `Vehicle · Muscle Car · Medium ground vehicle` |
| Prop | nothing more (characters saved before gear types have only props, and still do) | `prop` |

Under each item are its keywords as chips: built-in ones (a weapon category's intrinsic keywords, armor's, and ones an
ability grants) in *italics*, negative ones with a dashed red outline. Clicking an item's name opens a pop-up with
its type line and what each of its keywords does.

**Adding and changing gear:** **Run** adds gear (saved right away, never Starter). **Edit** adds, changes, and removes
it, and sets Starter. The gear dialog picks the type, then that type's fields, then keywords: weapon keywords (weapons
only, from the category's allowed list) and gear keywords, each with its rules text on hover. Changing an item's type or
category drops keywords it can no longer have; that's also how to turn an old prop into a real item.

**Keyword rules** (in `databank.js` as `notOn`, `excludes`, and `requires` on each keyword, from the keyword's own text):
Cybernetic can't be on weapons or vehicles; Bulky, Fragile, and Wearable can't be on vehicles; pairs like Bulky and
Compact or Silent and Concussive can't share an item; Obfuscating needs Explosive. Built-in keywords count, so a
one-handed melee weapon (always Silent) can't be Concussive. On a weapon, Compact is the weapon keyword and follows the
category's allowed list. Keywords an ability grants against these rules (Butcher's Gauntlet's Mounted) are kept as
**fixed** and never checked or removed.

**Create** builds the starting gear from the templates in `rules.js` (`archetypes[*].gear` and `augmentationGear`): each
book line and the items it gives, with a picker for each "of your choice" (a category, a vehicle, or keywords: any the
item can have, weapon or gear, positive or negative). Weapon Mount picks a starting weapon and its keyword on the
Origin step. Next waits until every pick is made.

To add equipment, a tool set, or a keyword restriction, edit `databank.js`; `tests/databank.test.cjs` checks the
restrictions against the keyword text, and `tests/rules.test.cjs` checks the starting gear templates against the databank.

## Conditions

A character and each piece of their gear can have conditions. Each one has a name, a severity of 1 to 4, and an
**intrinsic** flag. The name and intrinsic are chosen when the condition is added and can't be changed. To fix a typo,
remove the condition and add it again.

- **Chips:** each condition shows as a chip, with `x2`, `x3` or `x4` after the name (x1 isn't shown). Intrinsic
  conditions have their name in *italics*.
- **Where you change them:** in **Run** and **Edit**, **Add condition** (or **+ condition** on a gear item) adds one,
  and clicking a chip opens it to raise or lower its severity or remove it. **Detail** only shows them, and **Create**
  doesn't deal with them.
- **When it saves:** Run saves right away, and Edit saves on Save. Nothing is posted to Discord.
- **Adding a name that's already there** (ignoring case) doesn't make a second condition. It worsens the existing one
  by the added severity, up to x4.
- **Suggestions:** the Add dialog offers names to click, from `CONDITION_SUGGESTIONS` in `characters.js`. Edit that
  list to offer more.

## Adding abilities

Perks and augmentations (called *abilities* in the code) live in `abilities.js`. A new character gets theirs in **Create**,
which offers the ones their archetype and origin allow; after that, **Edit → Add ability** can add any of them. The sheet
shows them by name under **Perks** and **Augmentations**, and clicking one opens its text.

Each entry:

```js
{
  id: "g-force-adaptation",   // what characters save: lowercase words joined by "-"
  type: "augmentation",       // "perk" or "augmentation"
  name: "G-Force Adaptation",
  origin: "Gene-Spliced",     // one of the origins, or null
  archetype: null,            // one of the archetypes, or null
  summary: "One line",        // optional, plain text
  description: `Full text`,   // optional, formatted (below)
}
```

- Augmentations always have an origin, and often an archetype. Perks have an origin or an archetype, never both.
- Every entry needs a summary, a description, or both.
- Don't change an id once characters use it: a saved id that isn't in the list stops showing (it stays saved, so
  putting the id back brings it back). Cybernetic ids come from the name, so renaming one changes its id.

Descriptions: a blank line starts a new paragraph, lines starting with `- ` make a bullet list, `**bold**`, `*italic*`,
and these icons: `[advantage]` `[challenge]` `[boon]` `[drawback]` `[heat]` `[influence]`. Anything else shows as typed.
`tests/abilities.test.cjs` checks every entry against these rules.

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
name to `portraits/portraits.js`; it then shows up in the portrait picker (Choose portrait, when editing a
character). In the app, a character without one shows a placeholder; their Discord messages use
`portraits/default.png`. The GM's messages use `portraits/administrator.png`. Don't list either of those two in
`portraits.js`; characters can't pick them.

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
