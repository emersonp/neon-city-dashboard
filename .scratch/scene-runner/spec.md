# Scene Runner

Status: ready-for-agent

## Problem Statement

As the Administrator, I prepare and run scenes from memory and scattered references. The GM Screen shows the rulebook's enemies, objectives and obstacles, but I can't make my own enemies, objectives or hazards, can't save a planned scene with its cast, and can't track a scene while it plays out: each enemy's luck, a minion squad's size, a villain's wounds, how far the crew has progressed each objective or hazard, which obstacles still stand between the crew and the scene's Main Goal, and what round it is (which sets hazard damage). Rolling for an enemy means reading its attack text and setting up the Dashboard roller by hand. The Dashboard's Initiative card steps turns but doesn't count rounds.

## Solution

A new admin-only top-level tab, **Scene Runner**, between GM Screen and Settings, with four subtabs:

- **Custom**: make, edit and delete custom enemies, objectives and hazards (a left-hand list of custom items, plus Copy from rulebook). Export and Import save and load all custom items and scenes as one JSON file.
- **List**: saved scenes in a left-hand list; click one to see its details; New, Edit, Duplicate, Delete and Run.
- **Builder** (visible only while a scene is being built): name the scene, mark it Legwork or Conflict, add copies of enemies, objectives and hazards, and choose its Main Goal.
- **Runner** (visible only while a scene is running): roll as any enemy or hazard, track luck, squad size, wounds, progress, Deteriorating and Dealt with, step initiative in step with the overlay (now with a round number), and add more copies mid-run.

Only one scene is open at a time, built or run, never both. Before this work, the GM Screen's Adversaries subtab is renamed **Enemies** throughout, and the rulebook's hazards become a list of their own with a **Hazards** GM Screen subtab.

The lists (rulebook plus custom enemies, objectives, hazards) are the one source of truth for definitions. A scene holds a **copy** taken when the item is added; later fixes to the list don't change existing copies.

## User Stories

### Rename and lists

1. As the Administrator, I want the GM Screen's Adversaries subtab called Enemies, so that it uses the rulebook's word.
2. As a developer, I want the rename carried through the code, data, tests, portraits folder and README, so that there's one name for the concept.
3. As the Administrator, I want my custom enemies shown in the GM Screen Enemies subtab next to the rulebook's, so that I have one enemy list.
4. As the Administrator, I want a Custom option in the Enemies type filter, so that I can see only my own enemies.
5. As the Administrator, I want custom enemies to show on the same card as rulebook enemies, so that they read the same way.
6. As the Administrator, I want a Hazards subtab in the GM Screen listing the rulebook's hazards with their page numbers, so that I can look them up during play.
7. As the Administrator, I want my custom hazards shown in the Hazards subtab too, so that all hazards are in one list.
8. As the Administrator, I want every rulebook hazard to state its difficulty, hit chance and damage (defaulting to 50% and 10 × round), so that I don't have to remember the defaults.

### Scene Runner tab

9. As the Administrator, I want a Scene Runner tab between GM Screen and Settings, so that scene tools are one click from the GM Screen.
10. As a player, I want the Scene Runner tab hidden from me, so that I can't see the Administrator's plans.
11. As the Administrator, I want Custom and List always visible, so that I can manage my material at any time.
12. As the Administrator, I want the Builder subtab visible only while a scene is being built, so that the tab bar stays short.
13. As the Administrator, I want the Runner subtab visible only while a scene is running, so that it's clear which mode I'm in.
14. As the Administrator, I want never to be building and running at the same time, so that I don't edit a scene that's in play.

### Custom

15. As the Administrator, I want a left-hand list of my custom enemies, objectives and hazards, so that I can find one quickly.
16. As the Administrator, I want the list grouped or filterable by kind, so that a long list stays usable.
17. As the Administrator, I want to create a custom enemy with the same fields as a rulebook enemy (name, type, luck, description, attacks as name and text, perks), so that it plays like one.
18. As the Administrator, I want to write custom attacks in the rulebook's form (e.g. "75%; 45 physical damage"), so that the Runner can roll them the same way.
19. As the Administrator, I want to create a custom objective with a name, description, difficulty and an Urgent or Timed default, so that I can reuse my own objectives.
20. As the Administrator, I want to create a custom hazard with a name, description, difficulty (default 50), hit % (default 50), damage (10 × round, a fixed number, or none) and effect text, so that I can model hazards the book doesn't have.
21. As the Administrator, I want to edit a custom item, so that I can fix mistakes.
22. As the Administrator, I want to delete a custom item, so that I can drop what I no longer use, knowing scenes that copied it keep their copy.
23. As the Administrator, I want Copy from rulebook to start a custom item from a rulebook enemy, objective or hazard, so that I can make a variant without retyping it.
24. As the Administrator, I want rulebook entries to stay read-only in the app, so that the rulebook list stays faithful to the book.
25. As the Administrator, I want Export to save all my custom items and scenes as one JSON file, so that I have a backup if browser storage is cleared.
26. As the Administrator, I want Import to load that file back, so that I can restore or move my material to another browser.
27. As the Administrator, I want an unusable import file refused with a message, so that a bad file can't break my saved material.

### List

28. As the Administrator, I want a left-hand list of my saved scenes, so that I can pick one.
29. As the Administrator, I want clicking a scene to show its details (name, Legwork or Conflict, notes, every element and which is the Main Goal), so that I can review it before running.
30. As the Administrator, I want a New button, so that I can start building a scene.
31. As the Administrator, I want an Edit button, so that I can change a saved scene in the Builder.
32. As the Administrator, I want a Duplicate button, so that I can base a new scene on an old one.
33. As the Administrator, I want a Delete button with a confirm step, so that I don't delete a scene by accident.
34. As the Administrator, I want a Run button, so that I can start running a scene.
35. As the Administrator, I want Edit, Delete and Run greyed out on the scene that's running, so that I can't change a scene in play.
36. As the Administrator, I want starting to build or run while another scene is open to ask me to Save, Discard or Cancel, so that I don't lose work or run two at once.

### Builder

37. As the Administrator, I want to name a scene and add notes, so that I remember what it's for.
38. As the Administrator, I want to mark a scene Legwork or Conflict, so that running it sets up the overlay correctly.
39. As the Administrator, I want to add enemies from the enemy list (rulebook and custom), so that I can cast the scene.
40. As the Administrator, I want to add objectives from every tagged rulebook objective (including the security and Network obstacle objectives) and my custom objectives, so that I have the full range.
41. As the Administrator, I want to add hazards from the hazard list (rulebook and custom), so that the scene can have dangers.
42. As the Administrator, I want to enter obstacles as objectives or enemies, as the rulebook suggests, so that there's no separate obstacle kind to learn.
43. As the Administrator, I want each added item to be a copy taken at that moment, so that the scene stays as I built it.
44. As the Administrator, I want to add several copies of the same enemy with different names (e.g. two Bodyguards called Vex and Moth), so that I can tell them apart in play.
45. As the Administrator, I want to set a minion squad copy's size, so that the squad fits the scene.
46. As the Administrator, I want to set an objective or hazard copy's name, difficulty and Urgent or Timed, so that one definition serves different scenes.
47. As the Administrator, I want to remove an element from a scene, so that I can change my mind.
48. As the Administrator, I want to mark exactly one element as the scene's Main Goal, so that the Runner can tell me which obstacles still stand in the way.
49. As the Administrator, I want everything other than the Main Goal treated as an obstacle, so that I don't have to tag each one.
50. As the Administrator, I want to save a scene and return to the List, so that building has a clear end.
51. As the Administrator, I want to discard changes, so that I can abandon a bad edit.

### Runner: rolling

52. As the Administrator, I want to roll any attack of any enemy in the scene with one click, so that I don't set up the roller by hand.
53. As the Administrator, I want the hit chance and damage read from the attack text, so that the roll matches the stat block.
54. As the Administrator, I want a squad's damage computed from its current size (e.g. size × 5), so that a shrinking squad hits softer.
55. As the Administrator, I want a hazard's roll to use its hit chance and 10 × the current round (or its fixed damage), so that hazards escalate as the rulebook says.
56. As the Administrator, I want an attack whose text can't be read to still offer a plain percentile roll and show its text, so that every attack is rollable.
57. As the Administrator, I want each roll labelled with the copy's name and the attack (e.g. "Vex — Shock Pistol"), so that everyone knows who rolled what.
58. As the Administrator, I want Runner rolls to go where Dashboard rolls go (the screen, the OBS overlay, and Discord when Send to Discord is on), so that the table sees enemy rolls like any other.
59. As the Administrator, I want a per-roll keep-hidden toggle, so that I can roll secretly when the players shouldn't see it.

### Runner: tracking

60. As the Administrator, I want each enemy with luck to show its luck with quick damage and adjustment controls, so that I can apply hits fast.
61. As the Administrator, I want each minion squad to show its size with + and −, so that I can apply Collective Strength.
62. As the Administrator, I want every villain (minor and major) to have a wounds counter with + and −, so that I can track wounds after 0 luck.
63. As the Administrator, I want a Defeated toggle on villains, so that I decide when wounds knock one out.
64. As the Administrator, I want each objective and hazard to show progress against its difficulty, so that I know how close the crew is.
65. As the Administrator, I want a Dealt with toggle on every obstacle, so that I can record getting past something without depleting it (sneaking by, bribing).
66. As the Administrator, I want an obstacle counted as dealt with automatically when its progress is full or its luck or squad size reaches 0, so that I don't tick it twice.
67. As the Administrator, I want defeated and dealt-with elements to stay listed but dimmed, so that I can still see and undo them.
68. As the Administrator, I want the Main Goal to show how many obstacles are left, with a reminder that ignored obstacles add [challenge][challenge] (or [heat][heat]), so that I apply the rule when the crew goes for the goal.
69. As the Administrator, I want an Urgent objective to gain or worsen Deteriorating at the start of a round if it wasn't progressed in the last round, so that neglect has consequences.
70. As the Administrator, I want a Timed objective to gain or worsen Deteriorating at the start of every round, so that countdowns tick regardless.
71. As the Administrator, I want an objective already at Deteriorating ×4 to become Irreparable at the next worsening, with a reminder to add heat, so that I follow the rule.
72. As the Administrator, I want an Irreparable objective to stop accepting progress, so that the Runner reflects the rule.

### Runner: initiative

73. As the Administrator, I want the overlay's initiative to have a round number, shown as "Round N" next to the turn track, so that everyone knows the round.
74. As the Administrator, I want the round to go up by one when the turn steps from Slow back round to Hazard (and down when stepping back), so that I never count rounds myself.
75. As the Administrator, I want the Runner's turn arrows and the Dashboard's Initiative card to stay in step, so that I can step turns from either tab.
76. As the Administrator, I want hazards highlighted during the Hazard turn and enemies during the Antagonists turn, so that I know whose turn it is.
77. As the Administrator, I want running a Conflict scene to turn on the overlay's conflict layout at Hazard, round 1, so that the scene starts ready.
78. As the Administrator, I want a Make it a conflict button on a running Legwork scene, so that I can escalate when a complication or hazard turns it into a fight.
79. As the Administrator, I want ending a run to turn the conflict layout off, so that the overlay goes back to normal.
80. As the Administrator, I want the Runner to count turns and rounds by itself when OBS isn't connected, so that it works on GitHub Pages or without OBS.

### Runner: changing a run

81. As the Administrator, I want to add copies of enemies, objectives and hazards to a running scene, so that I can bring in reinforcements or complications.
82. As the Administrator, I want mid-run additions to go into this run only, so that the saved scene stays as planned.
83. As the Administrator, I want an Also add to the saved scene checkbox, so that I can keep an addition for next time.
84. As the Administrator, I want a reload mid-run to restore everything I was tracking (luck, squad sizes, wounds, progress, Deteriorating, round, turn), so that a crash or refresh doesn't lose the scene.
85. As the Administrator, I want End run to clear the run's tracking and leave the saved scene unchanged, so that I can run it again fresh.

## Implementation Decisions

- **Rename first, as its own commit.** Adversaries becomes Enemies everywhere: the GM Screen subtab label, the data module and its global, element ids and CSS classes, the test file, the portraits folder, the README and comments. No behaviour change.
- **New hazards data module**, built the same way as the enemies module (Node-testable, no page code, text in the format module's description format). Each hazard has a name, page, description, difficulty, hit chance (default 50), damage (10 × round by default, a fixed number, or none) and effect text. It's seeded from the Playtest Packet's hazard examples (falling concrete, intense heat, strong winds, narcotic smoke) and the hazards inside its jobs (e.g. Radiation Leak), with page numbers. A new GM Screen **Hazards** subtab renders it.
- **Objectives** come from the existing tables data: every entry tagged `Objective · Difficulty N`, with the difficulty read from the tag.
- **New scene rules module** (Node-testable, no page code). It is the main test seam and holds:
  - **Library:** rulebook and custom enemies, objectives and hazards merged into one list per kind, each item marked rulebook or custom.
  - **Custom item validation and cleaning:** custom enemies have exactly the rulebook enemy fields (name, type, luck unless a minion squad, description, attacks as name + text, perks); custom objectives and hazards have the fields listed under Custom above.
  - **Copying:** making a scene element from a list item. The element holds a full snapshot of the definition, plus what the copy may change: an enemy copy's name and squad size; an objective or hazard copy's name, difficulty, and Urgent / Timed / neither.
  - **Scenes:** name, Legwork or Conflict, notes, an ordered list of elements, and the id of the one element that is the Main Goal. Validation enforces at most one Main Goal and that it names an element of the scene.
  - **Attack reading:** given an attack's text and the run's state, returns its hit chance and damage, or "unreadable" (a plain percentile roll). It handles fixed damage, squad size × N, and 10 × round.
  - **Run state and a single reducer**, `apply(state, action) → state`. The state holds the scene's elements (copied from the saved scene when the run starts), per-element tracking (luck, squad size, wounds, Defeated, progress, Dealt with, Deteriorating level, Irreparable, whether it was progressed this round) and initiative (conflict, phase, round). Actions:
    - start run
    - change luck
    - set squad size
    - change wounds
    - toggle Defeated
    - change progress
    - toggle Dealt with
    - step turn forward or back (which counts rounds and, at the start of a round, applies Urgent / Timed Deteriorating and Irreparable)
    - make it a conflict
    - add element
    - end run

    Derived helpers: whether an element counts as dealt with (manual, full progress, or 0 luck / squad size 0), obstacles left before the Main Goal, and which elements to highlight for the current turn.
  - **Storage:** load and save custom items, scenes, the open scene (being built or running) and the run state through a store passed in, as the characters module does, under the app's existing storage prefix. Missing or broken storage never breaks the page.
  - **Export and Import:** one JSON document with a version, custom items and scenes. Import validates and cleans the document, refusing one it can't use with a message. It replaces the current custom items and scenes.
- **Only one scene open at a time.** The open scene is either being built or running, never both. Starting to build or run another asks Save, Discard or Cancel. The running scene's Edit, Delete and Run are disabled.
- **Overlay initiative gains a round.** The initiative message becomes conflict, phase, round. Round is a whole number of at least 1, defaulting to 1, and the overlay message rules clean it like the other fields. Stepping from the last phase (Slow) to the first (Hazard) adds a round; stepping back from Hazard to Slow takes one away (never below 1). Turning a conflict scene on starts at Hazard, round 1. The overlay shows "Round N" in its conflict layout. The Dashboard's Initiative card shows the round too.
- **The Runner and the Initiative card share one initiative state.** When OBS is linked, the overlay keeps the state and both tabs show what it reports; the Runner sends through the admin link like the Initiative card does. When OBS isn't linked, the Runner keeps the initiative in its run state, so turns and rounds still count. Ending a run turns conflict off.
- **Runner rolls use the existing dice rules and roll pipeline**, so they reach the screen, the overlay and Discord (subject to Send to Discord) like Dashboard rolls, labelled "<copy name> — <attack name>". A keep-hidden toggle sends the roll nowhere but the Runner.
- **Mid-run additions** are copies from the lists, added through the reducer to the run only. The Also add to the saved scene checkbox writes the same copy into the saved scene as well.
- **Admin-only** uses the existing data-admin mechanism. The tab sits between GM Screen and Settings.
- **Page code** for the new tab lives in its own feature file(s), separate from the rules module, following the repo's rule of keeping rules in a Node-testable file and page code in the feature's file.

## Testing Decisions

- Good tests check outward behaviour through a module's public surface: given these inputs or this sequence of actions, this state or this result. They don't inspect internal helpers or the DOM.
- **Scene rules module (main seam).** Tests drive the reducer through realistic sequences and check the resulting state and derived helpers:
  - Starting a run copies the scene and starts initiative at Hazard round 1 for a Conflict scene, or with conflict off for a Legwork scene.
  - Luck, squad size and wounds change and clamp at 0.
  - Dealt with is automatic at full progress, 0 luck or squad size 0, and manual otherwise.
  - Obstacles left before the Main Goal is counted correctly.
  - Stepping turns counts rounds both ways, never below 1.
  - Urgent objectives deteriorate only when not progressed in the last round; Timed ones deteriorate every round. Deteriorating ×4 followed by another worsening makes the objective Irreparable, which then refuses progress.
  - Make it a conflict, add element (run only), and end run work as described.
  - Attack reading covers every rulebook enemy attack (each is readable or deliberately unreadable), squad size × N, and 10 × round.
  - Copying snapshots the definition, so a later change to the list item doesn't change the copy.
  - Scene and custom item validation works, including one Main Goal at most.
  - Export then Import round-trips; Import refuses bad documents.
  - Storage tolerates a missing or throwing store.
- **Overlay message rules.** Extend the existing overlay rules test: initiative cleans round (default 1, whole number, at least 1); stepping across Slow → Hazard adds a round; stepping back takes one away.
- **Enemies data.** The existing adversaries test moves with the rename and keeps its checks.
- **Hazards data.** A new test in the same style as the enemies test: each hazard is named once, has a page, valid difficulty, hit chance and damage, and uses only known icon tokens.
- **Prior art:** the existing tests for the enemies data, the overlay rules, characters (load and save through a passed-in store) and dice. All run with the Node test runner as listed in the README.
- **Page wiring** (tabs, forms, admin-only visibility, the Save/Discard/Cancel prompt) isn't unit-tested, matching the rest of the repo. It's checked by hand in a browser on a fresh origin (an unused port), never on the user's own saved data.

## Out of Scope

- Custom images for enemy copies (planned for later).
- Editing a copy's stats beyond its name and squad size (enemies) or name, difficulty and Urgent/Timed (objectives and hazards).
- A "refresh from the list" action that updates a scene's copies.
- An automatic wound limit for villains.
- Editing rulebook entries in the app.
- Syncing scenes or custom items between browsers (Export and Import are the only way to move them).
- Automatically adding challenge dice or heat to crew rolls; the Runner only reminds the Administrator.
- Players seeing anything from the Scene Runner.

## Further Notes

- Rules sources: the Playtest Packet's scene objectives, urgent and timed objectives, and hazards (pp. 19–20); wounds and defeat (only villains take wounds; others drop at 0 luck); and the GM Screen's obstacle rules, including "Using Enemies for Obstacles" and ignored obstacles adding [challenge][challenge] or [heat][heat].
- The README says no server and no syncing; everything here stays in this browser's storage, which is why Export and Import exist.
- Suggested order: rename to Enemies, then hazards data and the Hazards subtab, then the overlay round, then the scene rules module, then the Scene Runner page (Custom, List, Builder, Runner).
