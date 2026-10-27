# Neon City Dashboard

A static page for Neon City games: dice rolls posted to Discord, a rules cheat sheet, a gear and keyword reference, tables to roll on, a character roster, and player settings.
Built with [Web Awesome](https://webawesome.com) (free, from its CDN). No build step.

## Who it's for

One group of friends playing live, together, on a Discord video call. That shapes what it does and doesn't do:

- **Everyone is on the call.** If you're not there, you're not there: nothing is kept or summarized for players who miss
  a session or join late, and the Discord channel isn't meant to be a record of the game.
- **The Administrator's camera is the shared state.** Heat, Group Influence, Day, Planning countdowns and initiative
  show on the OBS overlay on the Administrator's camera, which everyone is watching. They don't need to be posted to
  Discord as well.
- **Discord gets only rolls, Influence, shells and the Network.** The page pushes to a webhook and never reads anything
  back. Wounds, Luck and conditions are changed on the player's own sheet and said out loud at the table. Loading a shell
  posts too, since its Shell Source may add heat for the Administrator to put in the pool, and so does going into or out
  of the Network.
- **No server, no global state.** Each browser keeps its own characters and settings; there's no syncing between players
  or with the Administrator.

Features that only matter for asynchronous play, absent players, or players off the call (catch-up logs, mirroring the
overlay to Discord, shared or synced character state) are out of scope.

## Run it

1. Open `index.html` in a browser, or serve the folder (for example `npx serve` or `python -m http.server`).
2. In **Settings**, enter a player name and paste the Discord webhook URL. Until both are set, the page opens on Settings.
   Turn off **Send to Discord** to roll without posting; then no webhook is needed.
   The webhook is saved only in that browser (OBS keeps its own storage: use the browser source's **Interact** window).

Anyone who has the webhook URL can post to that channel, so share it with your players privately. It's never in the repo,
so the site is safe to host on GitHub Pages.

## OBS overlay (local only)

`overlay.html` is a stream overlay (Heat, Group Influence, Day, and the latest roll), from neon-city-overlay.
The Administrator's copy of the dashboard drives it through OBS's WebSocket server, so it only works on the streaming computer.

1. In OBS (28+): **Tools > WebSocket Server Settings**, turn on the server, and note the port and password from **Show Connect Info**.
2. Copy `obs-config.example.js` to `obs-config.js` and fill them in. `obs-config.js` is gitignored, so the password stays on this computer.
3. Add `overlay.html` to OBS as a **Browser** source (Local file, 1920×1080).
4. Open the dashboard from this folder and turn on **Administrator (GM)** in Settings.

The Dice tab (now **Dashboard**) then shows an **Overlay** card on the right with Heat, Group Influence and Day controls and
Planning, and under it a **Ticker** card (its items scroll along the bottom of the camera side, one after another; clear a box
to take its item down). Every roll plays on the overlay as well as in the dashboard and on Discord. The overlay keeps the
values; the cards show what it reports.
Without `obs-config.js` (on GitHub Pages, for example) the panel says it isn't set up, and everything else works as usual.

In the Overlay card, **Planning** starts a **15:00**, **3:00** or **0:30** countdown that takes over the whole overlay panel
(minutes over seconds). While it runs, it has **Play**, **Pause**, **Stop** and **+30** (30 more seconds). At zero the clock flashes
for 3 seconds and the panel comes back. When a countdown ends, by running out or by Stop, the last roll is cleared from the
overlay and the Dashboard. A cleared roll leaves the overlay without the ROLL label, dice or results, and whenever
the Dashboard says "No rolls yet", the overlay is cleared to match, including when the Dashboard connects to OBS. Opened in a normal browser, the overlay starts a 5-second countdown on <kbd>P</kbd>
(again to stop it) and pauses or plays it on <kbd>O</kbd>.

Under the roll result, an **Initiative** card has a **Conflict scene** switch. Off, the overlay shows nothing of initiative.
On, the overlay changes to its conflict layout (Heat, Group Influence and Day squeezed into one row, and the turn under them),
starting on **Hazard**; the card's arrows step through the round, Hazard (yellow), Fast (red), Antagonists (magenta) and Slow
(cyan), and round again. Stepping on from Slow to Hazard starts the next round, and stepping back from Hazard ends it (never
before round 1); the overlay shows **Round N** beside its turn track, and the card shows it too. In a normal browser the overlay toggles a conflict scene on <kbd>C</kbd> and steps the turn on
<kbd>[</kbd> and <kbd>]</kbd>.

Rolling **Initiative in the World** or **in the Network** from the Character tab posts who rolled, whether the character
goes **Fast** (a success, red) or **Slow** (a failure, cyan), and the total with any leftover Boons or Drawbacks.

## Administrator features

Turning on **Administrator (GM)** in Settings puts the `gm` class on the page, and anything marked `data-admin` shows
only then (one rule in `styles.css`); anything marked `data-player` shows only while it's off. The Dice tab is
**Dashboard** for the Administrator, with a third column (the Overlay and Ticker cards).
It's a switch anyone can turn on, so it hides things, it doesn't secure them:
every file reaches every browser. What keeps the overlay safe is that `obs-config.js` and the OBS password exist only on
the streaming computer.

A new Administrator feature gets its own file, loaded after `admin.js`, and uses `NCD_ADMIN`:

- `onGm(fn)`: called now and whenever the switch changes.
- `send(type, fields)`: sends a message to the overlay (`false` when it isn't connected). The messages are listed in
  `overlay-rules.js`; a new one goes there, gets handled in `overlay.html`, and `tests/overlay-rules.test.cjs` checks
  that every message the dashboard sends is one the overlay handles.
- `onOverlay(fn)`: each message from the overlay, already checked. `onLink(fn)`: the connection's state.

Keep the rules in a file Node can test (like `overlay-rules.js`) and the page code in the feature's file.

## Dice rules

Same as neon-city-overlay:

- **d100**: a tens d10 and a ones d10. `00` + `0` counts as 100.
- **Target (optional)**: a total at or under the target succeeds; over it fails. No target, no verdict.
- **Advantage dice** (0-4): d8 with 4 Boon faces and 4 blanks (50% each).
- **Challenge dice** (0-4): d10 with 6 Drawback faces and 4 blanks (60% each).
- Boons and Drawbacks **cancel one for one**; whatever is left over is the result.
- The target sticks between rolls; the dice pools reset to 0 after every roll.

Hovering over a Boon that counts (not one cancelled out), in any roll's result, lists what each of one or two Boons can be
spent on, read from the Cheat Sheet's **1-2 Boons (each)** list (`#boon-spends` in `index.html`). The 3-4 Boon options are the
Administrator's to choose, so they aren't shown.

Press <kbd>R</kbd> on the Dice tab to roll. The **×** in the corner of the result clears it (the Administrator's clears the
overlay's too). The result panel is always the height of the biggest roll (a target and all 8 pool dice), so it doesn't
jump about and whatever goes under it stays put.

## Tests

```
node --test tests/dice.test.cjs tests/discord.test.cjs tests/characters.test.cjs tests/format.test.cjs tests/abilities.test.cjs tests/rules.test.cjs tests/databank.test.cjs tests/tables.test.cjs tests/enemies.test.cjs tests/hazards.test.cjs tests/gear.test.cjs tests/overlay-rules.test.cjs tests/advancement.test.cjs tests/profiles.test.cjs tests/scene-rules.test.cjs tests/sheet-pdf.test.cjs tests/shells.test.cjs tests/avatars.test.cjs
```

## What's here

| File | Purpose |
| --- | --- |
| `index.html` | Page shell: header, theme toggle, tabs, and the dialogs |
| `tokens.css` | Every colour and font: the night palette (amber interface, cyan second light), the day one, and Web Awesome's theme variables mapped onto them |
| `atmosphere.css` | The air behind the page: two pools of neon light, smoke, and a faint still grain of rain |
| `styles.css` | The Web Awesome components dressed as a holographic interface, using the tokens |
| `shared.js` | Loaded first: localStorage access, the session (player, GM, open character), small helpers |
| `app.js` | Theme, tabs, settings, the dice pools, the roller and result panel, posting to Discord, and the Databank and GM Screen tabs |
| `config.js` | Shared settings for everyone: Discord emoji codes and the published address (no webhook) |
| `dice.js` | Dice rules (no page code, so it's testable in Node) |
| `characters.js` | Archetypes, origins, random handles and names, gear items and their conditions, Create's choices, saving characters (needs `dice.js` and `conditions.js`; testable in Node) |
| `conditions.js` | Conditions on anything that holds them (a character, a gear item, an enemy or a scene in the Scene Runner): adding, worsening, severity, removing, and the suggestions for each (testable in Node) |
| `shells.js` | Shells: the shell sheets (Quick Shell, Mass-Produced Synth, Utility Robot, Total Conversion Cyborg), who can load which, the Load Shell choices, loading, going back and a destroyed shell (needs `characters.js`; testable in Node) |
| `shell-ui.js` | The Load Shell dialog |
| `avatars.js` | Avatars: the avatar sheet (the sheet pack's Anonymous Avatar, called Quick Avatar), Enhanced Avatars and Installation Wizard, the New Avatar choices, entering and leaving the Network (needs `characters.js`; testable in Node) |
| `avatar-ui.js` | The New Avatar dialog |
| `conditions-ui.js` | Conditions on the page: the chips, the New condition dialog and a condition's dialog, shared by the Character tab and the Scene Runner |
| `roster.js` | Roster tab and the Character tab, including where its conditions go |
| `create.js` | Create mode: a new character built step by step from `rules.js` (step header, the archetype and origin picked so far, Back/Next/Finish, Discard, each step's controls) |
| `abilities.js` | The perk and augmentation catalog; edit it to add abilities |
| `rules.js` | Rulebook data for Create and the Databank: archetype intros and "on the job" text, skills, initiative, knows, starting gear templates; origin intros, options, Advancement text and augmentation gear; the sentences every archetype or origin section repeats (`text`) (needs `characters.js`; testable in Node) |
| `profiles.js` | The Databank's Archetypes and Origins pages, built from `rules.js`, `abilities.js` and `advancement.js`; Create's archetype panel uses its text too (testable in Node) |
| `databank.js` | The Databank tab's text from the rulebook's Equipment chapter: gear, tool sets, weapons, armor, vehicles, gear and weapon keywords with their restrictions (testable in Node) |
| `tables.js` | The GM Screen tab's tables: random gear keywords, liabilities, and distinctive visual traits (General); sample objectives (Objectives); obstacles (Obstacles); the complications (Complications); security system tiers with each defense's description, and the heat alarms add (Scenes); the headline news tables, and rolling them all into a news story (Headlines) (testable in Node) |
| `enemies.js` | The GM Screen tab's Enemies: every enemy's stat block from the Enemies chapter, with its bust in `portraits/enemies/` (testable in Node) |
| `places.js` | Where a Scene Runner scene is set: the districts, and the rulebook's types of location with their alternatives (testable in Node) |
| `hazards.js` | The GM Screen tab's Hazards: the Playtest Packet's example hazards and the hazards in its jobs, each with its difficulty, hit chance and damage (testable in Node) |
| `gear.js` | Gear rules from `databank.js`: built-in keywords, which keywords an item can take, damage and impact, labels, rules text, and Create's starting gear (testable in Node) |
| `gear-ui.js` | Gear on the page: item rows, keyword chips, rules text, and the keyword picker the gear dialog and Create share |
| `format.js` | Turns ability descriptions into HTML: paragraphs, bold, italic, lists, icon tokens (testable in Node) |
| `sheet-pdf.js` | The character sheet PDF's layout: both pages as drawing ops, with the skills block where the official sheet has it so Quick Shell and Quick Avatar overlays line up (testable in Node) |
| `sheet-pdf-ui.js` | Draws that layout with pdf-lib and its font add-on (fetched from a CDN the first time) and saves `<handle>.pdf`; the Character tab's **PDF** button. |
| `fonts/` | The PDF's fonts, Chakra Petch and Barlow Semi Condensed, as base64 in `sheet-fonts.js` (a script, so it loads even from `file://`), with their SIL Open Font License files |
| `docs/character-sheet.md` | Markdown version of the paper character sheet (the two-page one with overlay sheets) |
| `discord.js` | Builds the Discord message and posts it to the webhook |
| `emoji/` | Boon and Drawback PNGs to upload as Discord server emoji |
| `icons.js`, `icons/` | Game icons (advantage die, challenge die, boon, drawback, heat, influence) |
| `overlay.html` | The OBS overlay: Heat, Group Influence, Day and the latest roll, driven by the Dice tab |
| `overlay-rules.js` | The messages the dashboard and the overlay send each other, each stat's limits, and the ticker's, Planning countdown's and initiative's rules (testable in Node) |
| `admin.js` | The Administrator: the GM switch, `data-admin` parts of the page, and the one OBS link every Administrator feature shares |
| `admin-overlay.js` | The Administrator's Overlay and Ticker cards on the Dashboard tab: Heat, Group Influence, Day and the ticker |
| `admin-planning.js` | Planning, in the Administrator's Overlay card: the overlay's countdown |
| `scene-rules.js` | The Scene Runner's rules: the enemy, objective and hazard lists with the custom ones, cleaning custom items, copies, scenes, reading attacks, the run reducer, storage, Export and Import (testable in Node) |
| `scene-runner.js` | The Administrator's Scene Runner tab: List, Custom, Builder and Runner |
| `admin-initiative.js` | The Administrator's Initiative card: a conflict scene on the overlay, and whose turn it is |
| `obs-link.js` | Minimal OBS WebSocket client the dashboard and the overlay share |
| `obs-config.example.js` | Template for `obs-config.js` (gitignored): OBS host, port, password and which side the overlay sits on |

Things remembered in localStorage (all under `ncd.`): characters (with the ids of their perks and augmentations, their gear with its type and keywords, and the conditions on them and their gear), the open character, player name, GM toggle, Send to Discord, webhook, theme, the last tab, the target number, the last roll, and the Scene Runner's custom enemies, objectives and hazards, its scenes, and the scene being built or run with everything tracked in it.

## Databank

The **Databank** tab's **Archetypes** and **Origins** tabs have a tab for each archetype and origin, with everything
the book's section has: its opening paragraph, and for an archetype, what it does on the job, Things You Know About,
initiative, starting skills, starting gear, perks, and its augmentations from each origin; for an origin, the creation
steps and options, Advancement with that origin's XP table, its character perks, and its augmentations by archetype and
in full. `profiles.js` builds them from the data Create and Spend XP use, so nothing is written twice: fix a typo in
`rules.js` or `abilities.js` and it's fixed everywhere. The sentences each section repeats are in `rules.js`'s `text`.

The rest is a reference for the rulebook's Equipment chapter, in four tabs: **Gear Basics** (gear
basics, guided skill software, tool kits, targeted stimulants, computer gear, biotechnology, and other tools),
**Armory** (weapons and body armor), **Garage** (vehicles), and **Keywords** (positive and negative gear keywords,
and weapon keywords). It's all in
`databank.js`, written in the same format as ability descriptions (below). Each weapon lists the keywords it allows,
and each weapon keyword lists the weapons that allow it, both from the `allowed` lists in `databank.js`.
`tests/databank.test.cjs` checks the keyword tables against each other.

The **GM Screen** tab (Administrator only) holds tables to roll on or look up, in the Databank's style, all from
`tables.js`, in five subtabs: **General** (random gear keywords, liabilities, distinctive visual traits), **Objectives**
(the rulebook's sample objectives), **Obstacles** (the basics of obstacles, example obstacles, and the physical and
Network security systems as objectives), **Complications**
(the rulebook's minor complications, major complications, and plot twists, with their heat costs), and **Scenes**
(the security system tiers, and the heat generated by alarms raised by obstacles). A table whose first column is headed by a
die ("d100") gets a dice button in its card's title that rolls it and lights up the row; the security tiers table links
each defense to its description. `tests/tables.test.cjs` checks them.

A sixth subtab, **Enemies**, comes from `enemies.js`: every enemy's stat block from the Enemies chapter, sorted by
name, each with its type, luck, skills and attacks, perks, and page in the rulebook. A Type filter shows one type
(minion squad, antagonist, minor villain, major villain) or all of them, and the Hide Network and Hide Dramatic
checkboxes hide the Network's threats and the enemies with the Dramatic Enemy perk. Every enemy
outside the Network has its bust from the book's art, 256 pixels square, in `portraits/enemies/` (the Network's
threats have no art), ready to be a Discord avatar like a character's portrait. `tests/enemies.test.cjs` checks them.

A seventh subtab, **Hazards**, comes from `hazards.js`: the Playtest Packet's example hazards (falling concrete, intense
heat, strong winds, narcotic smoke) and the hazards inside its jobs, each with its page, difficulty, hit chance and damage.
Unless the book says otherwise, a hazard has difficulty 50, hits 50% of the time, and deals 10 × the round's number.
`tests/hazards.test.cjs` checks them.

An eighth subtab, **Headlines**, has the rulebook's six headline news tables from `tables.js`, each with its dice button.
**Generate news** rolls all six in order into a card above them, rolling again on Table X-1 where a row says to (the
victim, or the third party a motive sabotages). The subject, event, and victim read as one sentence ("C04: The Digital
Security Firm publicly denounced C15: The Software Firm."), and the other three show each roll beside its result. The
book's overlapping ranges are fixed (Table X-1's 33-35, Table X-2's 63-73, Table X-6's 75-80).

## Scene Runner

The **Scene Runner** tab (Administrator only, between GM Screen and Settings) is for preparing scenes and running them.
Its page code is `scene-runner.js`; the rules are in `scene-rules.js`, and `tests/scene-rules.test.cjs` checks them.

- **Custom**: your own enemies (the rulebook enemy's fields: name, type, luck unless a minion squad, description, attacks
  and perks), objectives (name, description, difficulty, Urgent or Timed) and hazards (name, description, difficulty,
  hit %, damage of 10 × round, a fixed number or none, and effect). **Copy from rulebook** starts one from a rulebook entry;
  rulebook entries themselves stay as the book has them. Custom enemies and hazards show in the GM Screen's Enemies (with a
  **Custom** type filter) and Hazards. **Export** saves every custom item and scene as one JSON file and **Import** loads one
  back, replacing them; a file it can't use is refused and nothing changes.
- **List**: the saved scenes. **New**, **Edit**, **Duplicate**, **Delete** and **Run**. The running scene can't be edited,
  deleted or run again.
- **Builder** (only while building): the scene's name, Legwork or Conflict, notes, and its elements: copies of enemies,
  objectives (every tagged objective in `tables.js`, and yours) and hazards, each taken when it's added, so later changes to
  the lists don't change it. A copy can have its own name (two Bodyguards called Vex and Moth), a squad its own size, and an
  objective or hazard its own difficulty and Urgent or Timed. One element can be the **Main Goal**; the rest are obstacles.
- **Runner** (only while running): one click rolls any attack, its hit chance read from the attack's text ("75%; 45
  physical damage"), a squad's damage from its size now, a hazard's from 10 × the round. The roll goes where Dashboard rolls
  go, labelled "Vex — Shock Pistol", unless **Keep the next roll hidden** is on. Each element tracks luck, squad size,
  wounds and Defeated (villains), progress, Dealt with (automatic at full progress, squad size 0, or 0 luck for anyone but a
  villain, who fights on with wounds until marked Defeated), and
  Deteriorating: at the start of each round an Urgent objective not progressed in the round before, and every Timed one,
  gains or worsens it, and past ×4 becomes Irreparable (no more progress; add heat). The Main Goal shows how many
  obstacles are left. The turn arrows step the overlay's initiative like the Initiative card, so the two stay in step;
  without OBS the Runner counts turns and rounds itself. Running a Conflict scene starts the overlay's conflict layout at
  Hazard, round 1; **Make it a conflict** does that for a Legwork one; **End run** turns it off and clears the tracking.
  Copies added mid-run are for this run only, unless **Also add to the saved scene** is ticked.

Only one scene is open at a time, being built or running: starting another asks to Save, Discard (or End run) or Cancel.
Everything stays in this browser (a reload mid-run brings it all back), so Export now and then.

## Gear

A character's gear is a list of items. Each has a **name**, a **quantity** (shown as `×3` when above 1), a **type**, the
**keywords** added to it, and conditions (below). Everything about the types comes from `databank.js`, through `gear.js`:

| Type | What's picked | Shown as |
| --- | --- | --- |
| Weapon | a category from the Armory | `Pistol · 1h · +20 dmg` (hands and damage work out from the category and Jagged, Mounted, Miniaturized) |
| Kit | a tool set, its quality, optionally a skill it's hyper-specialized for, and whether it's consumable | `Kit · Paramedic's Kit · Standard · +20 impact` |
| Equipment | any other entry in Gear Basics (skill software, stimulants, computer gear, biotechnology, other tools), plus a skill or option when the entry needs one | `Equipment · Computer gear` |
| Armor | Armored x1 to x4; each level's keywords come with it | `Armor · Armored x2` |
| Vehicle | a vehicle from the Garage | `Vehicle · Muscle Car · Medium ground vehicle` |
| Prop | nothing more (characters saved before gear types have only props, and still do) | `prop` |

Under each item is a line of its keywords in small capitals (set apart from the outlined condition chips): built-in ones
(a weapon category's intrinsic keywords, armor's, and ones an ability grants) in *italics*, negative
ones in red. Clicking an item's name opens a pop-up with
its type line, a short description in the book's words (`descriptionText` in `gear.js` picks which parts), and its
keywords, each folded away under its own name.

**Adding and changing gear:** **Run** and **Edit** both add, change, and remove gear. Run saves right away and doesn't
set Starting gear (new gear isn't; changed gear keeps its own); Edit has a Starting toggle on each item (and in the gear
dialog), and saves on Save. Create's gear, and gear bought or kept with Spend XP, is starting gear. Outside Edit, starting
gear is tagged **Starting** in its row, and its pop-up says so. Removing an item in Run asks first. A name is optional: new gear's name box fills in from
what the item is ("Improvised Hacker's Deck", "Rail Pistol", "Environment Suit (Underwater)", "Body Armor x2") and
follows your picks until you type your own, and a blank name saves as that. The gear dialog picks the type, then that type's fields, then keywords: weapon keywords (weapons
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

Create's **Details** step needs a handle and a physical appearance. Under the appearance, the distinctive visual traits
table (`tables.js`, also on the GM Screen tab) adds a trait to the end of the physical appearance, as a sentence: click a
row, or roll d100 with the dice button. Picking again swaps that trait while it's still at the end of the text.

To add equipment, a tool set, or a keyword restriction, edit `databank.js`; `tests/databank.test.cjs` checks the
restrictions against the keyword text, and `tests/rules.test.cjs` checks the starting gear templates against the databank.

## Jobs and sessions

A character who isn't on a job has **Start Job** where **Run** usually is. Starting a job resets them to their starting
values (`resetToStarting` in `characters.js`): Luck to max, Influence to starting (1 less if their last job failed), no
wounds, no Used, only intrinsic conditions on them and their gear, and only their starting gear. The starting gear is
saved with the job (`character.job`), so gear lost or changed in Run comes back at the end; marking or unmarking Starting
in Edit mid-job still counts. After that, the button says **Run**.

- **End Session** (Run, top and bottom): each skill marked Used goes up by 1 (to 95 at most), Used is cleared, and a
  dialog lists the skills that went up before going back to Detail.
- **Finish Job** (Run, bottom only) opens a page that ends the session, lists the skills that went up, and asks for an
  improvement (an untrained skill to 55%, +10 maximum luck, or 1 XP) and whether the job succeeded. A success earns the
  XP entered and a reward (a distinctive feature: a trait picked or rolled from the distinctive visual traits table and added
  to the end of the physical appearance, as a sentence; a new starting prop; or the Cybernetic keyword on
  a piece of starting gear that can take it). A failure earns 1 XP and the next job starts with 1 less Influence.
  **Confirm** saves it all, resets to starting values and gear, ends the job, and goes on to Spend XP.
- **Liability**: a character without one (it isn't asked for in Create) must pick one at End Session or Finish Job, from
  the liability table (`tables.js`, also on the GM Screen tab). Clicking a row picks it; the dice button rolls d100 and picks
  the row it lands on, as many times as you like. End Session's dialog won't close until there's a pick, and Finish Job
  won't confirm. It shows under the appearance and can be changed in Edit. The picker is `NCD_APP.tablePicker`, for any
  table whose first column names a die.
- **Repercussions and Story Rewards**: free text (line breaks kept), shown under the appearance on Detail (when there's
  any) and under the conditions while running, where the pencil changes it in a dialog. Edit has a box for it, and Finish
  Job's page starts with one, filled in with what's there, for adding or removing what the job changed; Confirm saves it.
- **Spend XP** lists every benefit from the XP table with its cost (worked out as earlier purchases leave the
  character: a second perk costs more) and a **Buy** button, and what's been bought so far, each removable. Until
  it's confirmed, the character is saved as spending XP (a badge on the Roster) and only opens to this page, and the gear
  picked up on the job is kept so it can be bought as starting gear. **Done**, or spending the last XP, asks to confirm
  the purchases and shows the XP left; Confirm moves the XP spent from Available to Spent and goes to Detail.
  Common gear opens the gear dialog with only what Gear Basics' Common Gear entry allows (`isCommon` in `gear.js`):
  weapons with no added keywords (not sniper rifles, launchers or mines, marked `common: false` in `databank.js`),
  props, improvised or consumable standard tool kits, and equipment tagged common.

The XP table is one table for every origin (the book has one per origin): `advancement.js` holds it, with the costs
that differ by origin in `ORIGIN_COST`, and the rules for each purchase. The Databank's **XP** tab shows it.
`tests/advancement.test.cjs` checks it.
- **Abandon Job** (Roster, for a character on a job) asks first, then ends the job without finishing it: starting
  values and gear, with no XP or improvement.

## Shells

A character is a mind and a default body (`characters.js`). The sheet's right half is the body: the physical skills'
chances, the mental skills' intrinsic dice, augmentations, the physical appearance, and wounds (`character.defaultBody`).
The rest is the mind's, on the character. While a shell is loaded (`character.shell`, the same shape plus its type, name,
choices and own conditions), its half of each skill counts instead, as a shell sheet laid over the right half would.
Saves from before shells have no default body: opening one says so, and it can only be deleted.

- **Load Shell** (Run's Body section) opens a dialog: pick a shell the character can load (synthetic minds only
  synthetic shells, human minds only human ones), then make its sheet's choices: Shell Identity, Capabilities (4
  different skills, then 2 more), the Cyborg's 2 augmentations, Shell Source, a name and an appearance. Loading
  replaces any shell already loaded. **The Right Kind of People** takes 1 Influence off; **Kidnapping or Larceny**
  says in the Discord post to add 4 heat. Device Driver skips Shell Source for the Synth and the Utility Robot.
- In a shell, physical skills can't be marked Used (a covered skill can't be improved), gear with the Cybernetic
  keyword says **In default body** and can't be rolled, and wounds go on the shell. Edit still changes the default body.
- **Return to Default Body** and **Shell Destroyed** ask first. A destroyed shell also adds Memory Loss, or worsens it.
  Start Job, Finish Job and Abandon Job leave the character in their default body. The PDF always prints the default body.

The Total Conversion Cyborg's augmentation list is a placeholder in the book, so it offers every Synthetic
augmentation except Synthetic Body. `tests/shells.test.cjs` checks the shells.

## Avatars

A scene in the Network has each character overlay an avatar, on top of a shell if one is loaded. The character keeps
one avatar (`character.avatar`, the mind's, kept between jobs) and `character.inNetwork` says it's on. The avatar sheet
is the sheet pack's Anonymous Avatar, called **Quick Avatar** as the perks do.

- **New Avatar** (Run's Network row, outside the Network) asks for a Network username (it falls back to the handle), an
  appearance (each puts 1 challenge die on a Gossip skill) and a description (it starts as the Network Default
  appearance). With **Enhanced Avatars** it can be an Enhanced Avatar instead: 2 mental skills with 2 advantage dice, 2
  more with 1, and 2 Installed Software boxes. **Installation Wizard** checks 1 box on a Quick Avatar. Giving an avatar
  to a crewmate isn't handled.
- **Enter the Network** (making an avatar first if there isn't one) and **Leave the Network** save right away and post
  to Discord. 0 luck in the Network is just leaving: nothing is destroyed.
- In the Network, mental skills roll with only the avatar's dice; physical skills and Initiative in the World are
  hidden; augmentations and Cybernetic gear say **Not in the Network**; nothing rolls a physical skill (so no weapon
  rolls). Wounds are the body's underneath, and say which. The shell buttons are hidden until they leave.
- Start Job, Finish Job and Abandon Job take them out of the Network and keep the avatar. Edit and the PDF never show
  the avatar. Installed Software and the appearances' other text aren't automated.

`tests/avatars.test.cjs` checks the avatars.

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
It also has an **Impact** box (whole numbers above zero, or blank): on a success, the main line gets a third item, the
total plus the impact (`Success! 32 · Impact 52`).

**Pushing your luck:** after a failed check in the roll dialog, a player (never the Administrator) gets a **Push your
luck** button saying what it costs: 10 Luck and one challenge die for every 10 the total is over the target. It only
shows while the character has that much Current Luck and the challenge dice wouldn't go past 4. Pushing takes the Luck
off the sheet, rolls the new challenge dice onto the same result (only they spin), and makes it a success, marked
"Pushed · 20 Luck"; it posts again as `Parker rolled *Hack* against 30, pushed 20 Luck, and got a`. An attack (a roll from
a weapon's dice button) can't be pushed unless the character has Corrective Measures (melee) or Targeting Correction
(ranged), and then its impact counts the Luck spent instead of the total. Will to Succeed makes each 10 Luck count for 20,
and Transmute Probability adds an advantage die per 10 Luck (up to 4). Mental and digital attacks (Déjà Vu, Data
Scramble) aren't told apart from checks, since the dialog can't know one. The rules are `pushCost` and `push` in `dice.js`.

While running, gear with an obvious roll (`rollOf` in `gear.js`) has a dice button that opens the roll dialog for it,
with Impact filled in from the item: melee weapons roll *Slash, Stab, or Strike Someone* with 1 extra Advantage die;
pistols, rifles, shotguns, sniper rifles, and launchers roll *Shoot Someone*; thrown weapons roll *Throw Something*
(the book's skill for ranged attacks with them); a kit's button is a menu of its set's three skills (pick one to roll it
with the kit's impact bonus), and a hyper-specialized kit rolls its one skill straight away, with 2 extra Advantage dice (Right Tool for the Job x2); and a vehicle rolls
*Drive or Pilot Something*. Mines, equipment, armor, and props have no button.

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
