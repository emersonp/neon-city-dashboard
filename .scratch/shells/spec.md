# Shells

Status: ready-for-agent

## Problem Statement

A character's mind can load into another body (a shell) during a job, and the shell sheet overlays the right half of
the character sheet. The dashboard stores a character as one flat sheet, so there's no way to load a shell, and no
separation between what belongs to the mind and what belongs to the body. That separation is also what replacing a
dead default body will need later.

## Rules (from the PDFs)

- First Readers p. 15: the right half of the sheet is the default body; a shell sheet overlays it and "overrides
  everything [it] covers up". It stays until the job ends, the character dies or the shell is destroyed, they load into
  another shell or back into their default body, or a mechanic removes it.
- The overlay covers the physical skills' chances of success, the mental skills' intrinsic dice, Appearance, Body Perks,
  Weapons and Wounds. The physical skills' intrinsic dice and the mental skills' chances stay visible (they're the mind's).
- Advancement: "Skills covered by an avatar or shell overlay cannot be marked for increase."
- Back from the Dead: dying in a shell destroys it and puts the character back in their default body; either way they
  gain Memory Loss, or it worsens one step if they already have it from a death this job.
- Shell sheets (`Character_and_Shell_Sheets.pdf` and the First Readers appendix): Quick Shell, The Synth
  (Mass-Produced Synth), Utility Robot, Total Conversion Cyborg. Farmer (a job-specific shell) is left out.

## Decisions

1. **Quick Shell** follows `Character_and_Shell_Sheets.pdf` (the later order): Specific Individual marks 1 challenge die
   on Convince Someone, Intimidate Someone and Lie to Someone; Anonymous Identity marks 1 on Gossip with Citizens,
   Gossip with Corporates and Throw Money at the Problem.
2. **Catalog**: Quick Shell, Synth, Utility Robot, Total Conversion Cyborg. Farmer is left out.
   - The Synth and Utility Robot print the same numbers: 1 advantage die on Analyze Data, 2 on Gossip with AI, 1 challenge
     die on Gossip with Citizens, 1 advantage die on Lie to Someone; Conceal an Object 75%, Sneak Around 70%. Body perks:
     Synthetic Body (the catalog's augmentation), Stock Model (Inconspicuous x2, intrinsic), Fresh Install (text). Shell
     Source: Another Scene, or The Right Kind of People.
   - The Cyborg's augmentation list is placeholder text in the book. Its picker offers every Synthetic augmentation in
     `abilities.js` except Synthetic Body (the shell's Living Brain, Synthetic Body perk replaces it); pick 2.
     (Only two Synthetic augmentations have no archetype, so "non-archetype only" would leave no choice.)
3. **Mind and body.** No migration: a saved character without `defaultBody` throws when it's opened (the Roster still
   lists it, so it can be deleted).
   - Mind (on the character): mental skill values, physical skill dice, initiatives, luck, influence, XP, knows,
     perks (`abilities`), origin, pronouns and Network appearance, the character's conditions.
   - Body (`defaultBody`, and `shell`): `skills` (physical values, mental dice), `augmentations`, `appearance` (physical),
     `wounds`. A shell also has its own `conditions`, its type, name, and the choices it was loaded with.
   - What's in effect: the shell's body if there is one, otherwise the default body. In a shell, only the shell's mental
     dice count.
   - Unconscious and Dead aren't tracked (they never were); "Shell destroyed" is an action, not a checkbox.
4. **Gear** goes with the mind, except gear with the Cybernetic keyword: it's installed in the default body, so in a shell
   it's marked "In default body" and has no roll button.
5. **Wounds** are per body. **Shell destroyed** removes the shell, puts the character back in the default body (with its
   own wounds), and adds Memory Loss (worsened if there already). Memory Loss is added as an ordinary (not intrinsic)
   condition, so the end of the job clears it.
6. A shell's own conditions live on the shell and go when it does.
7. One current shell, no library. Loading replaces the current shell. Start Job, Finish Job and Abandon Job clear it.
   Loading is only possible in Run (so only on a job).
8. **Shell Source**: The Right Kind of People takes 1 Influence off the character (it needs 1). Every load, return and
   destroyed shell posts to Discord; the Source line is in it, with "add 4 heat to the heat pool" for Kidnapping or Larceny.
9. **Body type** is enforced: a Synthetic character can only load synthetic shells (Synth, Utility Robot, a synthetic
   Quick Shell); anyone else, only human ones (a human Quick Shell, the Cyborg). The Quick Shell's Body Type is set by the
   character's origin. **Device Driver** skips Shell Source for the Synth and Utility Robot.
10. Perks that change luck on a swap (Doc's, +20 luck, the temporary luck pools) aren't automated.
11. In a shell, physical skills can't be marked Used; rolling a skill uses the shell's values.
12. The character sheet PDF always prints the default body.
13. Quick Shell and Cyborg Capabilities: 6 distinct skills; the first 4 get 2 advantage dice (mental) or 75% (physical),
    the last 2 get 1 advantage die or 65%. Identity dice add to these (2 advantage and 1 challenge on one skill is fine).
14. Shell-only perks (Stock Model, Fresh Install, Living Brain, Synthetic Body) are text in the shell catalog; a shell
    reuses an `abilities.js` augmentation where one exists (Synthetic Body). Nothing timed (Fresh Install) is automated.
    A synthetic Quick Shell gets Synthetic Body too.
15. Every shell has a name and a physical appearance. The Quick Shell and Cyborg ask for a name; the Synth and Utility
    Robot are named after themselves. Appearance is asked for, not required.
16. Load Shell, Return to Default Body and Shell Destroyed are Run-only. A banner shows the shell in Display and Run.
    Edit changes the default body; a loaded shell can't be edited.

## Out of scope

Replacing the default body after it dies; avatars; automating luck perks or timed shell effects; printing a shell.

## Modules

- `characters.js`: the mind/body split behind the existing helpers (`skill`, `withSkill`, `abilityIds`, `withAbility`,
  `wounds`, `appearance`...), plus `defaultBody`, `body`, `inShell`, `withoutShell`, `withWounds`, `withPhysical`.
- `shells.js` (new, testable): the catalog, who can load what, the choices' validation, building a shell, loading,
  returning, destroying.
- `shell-ui.js` (new): the Load Shell dialog.
- `discord.js`: `shellMessage`.
- `roster.js`: the shell banner and buttons; cybernetic gear in a shell; Edit works on the default body.
