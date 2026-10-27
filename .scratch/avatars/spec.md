# Avatars

Status: ready-for-agent

## Problem Statement

A scene in the Network has every character overlay an avatar sheet over the right half of their character sheet, on
top of a shell if one is loaded. The avatar replaces the mental skills' intrinsic dice, physical skills can't be used,
and at 0 luck the character is kicked off the Network rather than killed. The dashboard can load shells but has no way to
go into the Network, so a player in a Network scene still sees (and rolls) their body's dice and physical skills.

## Rules (from the PDFs)

- First Readers p. 15: at the start of a scene in the Network, each player overlays an avatar sheet; if a shell is
  overlaid, the avatar goes on top of it. At the start of the next scene outside the Network it comes off. "When a
  character manifests as an avatar in the Network for the first time, follow the directions on the sheet."
- p. 20, scenes in the Network: physical skills can't be used (they're covered by the avatar sheet); body augmentations
  can't be used; no one can make physical attacks.
- p. 28: shell and avatar overlays cover the mental skills' intrinsic dice and replace them with the overlay's.
- p. 29: Network conflict initiative is rolled on Initiative in the Network, as on the avatar overlay.
- Advancement (p. 26): "Skills covered by an avatar or shell overlay cannot be marked for increase."
- 0 luck in the Network (p. 207): the character is kicked off or traced; nothing dies.
- Enemies' Malevolent Interface: a hit on an avatar at 0 luck gives "their user in the physical world" 1 wound.
- The sheet: `Character_and_Shell_Sheets.pdf` p. 13, **Anonymous Avatar** (the later sheet pack). First Readers' last
  page has an older **Quick Avatar** with different appearances and software; it isn't used.
- Perks: Enhanced Avatars (Hacker), Installation Wizard (Synthetic), Data Airlock (gear), Technopathy (Astral Ghost).

## The sheet (Anonymous Avatar)

- **Network Username**, **Description**.
- **Avatar**: "This shell only exists in the virtual reality network, and represents your digital manifestation in the
  virtual world. Copy your Initiative in the Network to this avatar."
- **Appearance** (choose one), each 1 intrinsic challenge die:
  - Featureless Humanoid: basic default, humanoid but smooth and featureless. Gossip with Criminals.
  - X-Bit Character: looks like a video game character from the 8-bit or 16-bit era. Gossip with Corporates.
  - Immaculate Detail: mostly humanoid, lovingly crafted, hyperrealistic. Gossip with AI.
  - Abstract Form: strange, not humanoid (a tornado full of monkeys, a talking pie). Gossip with Citizens.
- **Installed Software** ("Do not check any of the boxes below unless you are directed to by a perk"):
  - VPN Tunnel: Digital attacks against you add 2 challenge dice to the roll.
  - Keychain: You always succeed on initiative rolls.
  - SUDO Commands: When you roll any number of advantage dice, if none of the dice show a boon symbol, change 1 die to
    show a boon symbol.
  - Async Attack Processes: You do not add challenge dice to a roll due to pushing your luck.
  - CHMOD Access: You add 2 advantage dice to any roll you make to deal with an obstacle.
  - Icebreaker Suite: You can push your luck on digital attacks.
  - Daemon: If you are reduced to 0 luck and forced to exit the scene, you can take 1 montage action immediately
    following the conclusion of the scene. This montage action must be something that a piece of software could
    reasonably accomplish for you.
  - Co-Op Mode: Do not add challenge dice to rolls for helping a crew member.
  - Emulation Software: You can use the skill chance of success of any crew member in the same scene for any roll you
    would make with that skill.

## Decisions

1. **Sheet**: Anonymous Avatar's numbers and text (above). The UI calls it **Quick Avatar**, the name the perks use.
2. **One saved avatar** per character, on the mind (`character.avatar`): kind (quick or enhanced), username, appearance,
   description, software, and (enhanced) its skill dice. It persists across jobs (Enhanced Avatars says avatars can be
   re-used on later jobs). **New Avatar** replaces it.
3. **In the Network** is `character.inNetwork` (true/false). **Enter the Network** and **Leave the Network** are
   Run-only buttons, driven by the player, with no link to the Scene Runner. Entering with no saved avatar opens the New
   Avatar dialog first. Leaving keeps the avatar. Start Job, Finish Job and Abandon Job clear `inNetwork` (as they clear
   the shell). No migration: an old save has no avatar and isn't in the Network.
4. **0 luck** has no action of its own: being kicked off is Leave the Network. No Memory Loss, no "destroyed".
5. **What's in effect in the Network**:
   - Mental skills: the mind's chances; only the avatar's dice count (the appearance's challenge die, plus an
     enhanced avatar's advantage dice). The body's (or shell's) mental dice don't.
   - Physical skills can't be rolled or marked Used.
   - Initiative in the World is hidden; Initiative in the Network is the mind's, as the sheet says to copy it.
   - Augmentations (the body's and a shell's) and Cybernetic gear are shown as unavailable, with no roll buttons.
   - Weapons can't roll (no physical attacks; digital attacks are skill rolls, and the databank has no digital
     weapons). Other gear is unaffected.
6. **Wounds**: the avatar has none. The wounds of the body underneath (the shell if one is loaded, else the default body)
   stay visible and editable, labelled as that body's, since a Network attack can wound the user.
7. **Shells and the Network** don't mix: you're in the real world (default body or a shell) or in the Network. While in
   the Network, Load Shell, Return to Default Body and Shell Destroyed are unavailable. A shell loaded before entering
   stays loaded underneath and is still in effect after leaving.
8. **New Avatar** is Run-only, and only outside the Network. Edit mode doesn't touch the avatar. It offers:
   - **Quick Avatar** (everyone): username, appearance, description; no software. With **Installation Wizard**, pick 1
     software box.
   - **Enhanced Avatar** (only with the Enhanced Avatars perk): as Quick, plus 2 different mental skills (not the
     initiatives) with 2 advantage dice each, 2 other different mental skills with 1 each, and 2 software boxes (the
     "keep it yourself" case). Installation Wizard doesn't add a box: one is already checked. The appearance's
     challenge die stacks with these (2 advantage and 1 challenge on one skill is fine).
   - The username is optional and falls back to the character's name; the description is prefilled from the
     character's Network Default appearance.
9. **Software and appearance text** are shown on the avatar; nothing beyond the dice is automated (Keychain, SUDO,
   Daemon, and the rest are the player's to apply).
10. **Shown**: Display and Run show an "In the Network" banner with the username, appearance and software. In Run, the
    Body section's place shows the avatar while in the Network. Outside the Network, Run shows a line "Avatar:
    <username>" beside Enter the Network and New Avatar (just the two buttons if there's no avatar yet).
11. **Discord**: entering and leaving the Network post, as shell events do. Entering: "<handle> is HACKING THE
    PLANET!" Leaving: "<handle> has entered the desert of the real."

## Out of scope

Giving an Enhanced Avatar to a crewmate (another player's save); Data Airlock's Antivirus box (no such box on the
sheet; its text stays as is); Technopathy's Astral Ghost avatar (no sheet); Network-related luck perks (Network Medic's
20 luck, temporary luck pools); printing an avatar on the PDF; any link between Scene Runner scenes and the Network.

## Modules

- `characters.js`: `inNetwork`, `avatar`, and the existing helpers (`skill`, roll/Used checks, augmentations in effect)
  taking the Network into account; `withoutNetwork` alongside `withoutShell` for the job buttons.
- `avatars.js` (new, testable): the sheet (appearances, software), the New Avatar choices' validation (incl. Enhanced
  Avatars and Installation Wizard), building, entering, leaving.
- `avatar-ui.js` (new): the New Avatar dialog.
- `discord.js`: `networkMessage`.
- `roster.js`: the banner, Enter/Leave/New Avatar, the avatar in place of the Body section, shell buttons disabled in
  the Network, unavailable augmentations, gear and physical skills.
