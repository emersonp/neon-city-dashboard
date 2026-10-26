// The GM Screen tab's Hazards: the Playtest Packet's examples of hazards, and the hazards inside its jobs.
// No page code here, so it can be tested in Node. Text uses the format.js description format, like enemies.js.
//
// A hazard is something dangerous in a conflict scene. It has a difficulty and can be progressed to completion like an
// objective; at the start of each round (the Hazard turn) it attacks whoever the Administrator decides it affects.
// Unless it says otherwise, it hits 50% of the time and deals 10 × the number of rounds so far (this one included).
//
// DEFAULT_HIT, DEFAULT_DIFFICULTY  the rulebook's defaults (the book gives its examples no difficulty)
// hazards { name, page (its page in the Playtest Packet), text (what it is), difficulty, hit (its attack's % chance),
//         damage ("round" for 10 × the round, a fixed number, or null for none), effect (what it does) }
// damageLabel(damage)  "10 × round damage", "20 damage" or "no damage"
// hazardTag(hazard)    its numbers in a line: "Difficulty 50 · 50% · 10 × round damage"
(function (root) {
  const DEFAULT_HIT = 50;
  const DEFAULT_DIFFICULTY = 50;
  const STANDARD = "On a hit, it deals damage equal to 10 × the number of rounds that have passed in the conflict scene (including the current one).";
  const standard = (fields) => ({ difficulty: DEFAULT_DIFFICULTY, hit: DEFAULT_HIT, damage: "round", effect: STANDARD, ...fields });

  const hazards = [
    standard({ name: "Falling Concrete", page: 20, text: "Falling chunks of concrete from a collapsing building." }),
    standard({ name: "Intense Heat", page: 20, text: "Intense heat from the welding mechanisms inside a robotics factory." }),
    standard({ name: "Strong Winds", page: 20, text: "Strong winds created by a hovering security vehicle shoving the crew around." }),
    standard({ name: "Narcotic Smoke", page: 20, text: "The inebriating effects of smoke in a narcotics den." }),
    standard({
      name: "Poisonous Spores", page: 83,
      text: "As an added precaution, C07: The Medical Corporation has released poisonous spores into the subway tunnel and open space surrounding Delta 14's exterior. These spores are a hazard to any living creature in the area (including the test subject).",
      effect: `${STANDARD} This hazard can be completely ignored by wearing a fully airtight and contained protective suit. A broad-spectrum antibiotic inoculation obtained by a street doctor can offer thirty-six hours of protection from the spores.`,
    }),
    standard({
      name: "The Cithaeron's Guns", page: 89,
      text: "If the crew attempts to board the Cithaeron casino station by some means other than its shuttles or the maintenance platform's drones, the station's guns open fire.",
      effect: `${STANDARD} The guns are a standard hazard that deals damage at large vehicle scale.`,
    }),
    standard({
      name: "Radiation Leak", page: 90, damage: 20,
      text: "The fusion reactor powering the Cithaeron suffers a radiation containment breach, either due to the crew's actions or as a last-ditch effort by the station's command AI to stop human intruders from seizing control of the station.",
      effect: "During the hazards phase of each round, all human characters inside the reactor room of the station must succeed on a roll to tough it out, taking 20 physical damage from the radiation on a failure. Additionally, the entire station gains the **Irradiated x2** scene condition, which functions as a negative condition for all humans.",
    }),
  ];

  const damageLabel = (damage) => (damage === "round" ? "10 × round damage" : damage ? `${damage} damage` : "no damage");
  const hazardTag = (h) => `Difficulty ${h.difficulty} · ${h.hit}% · ${damageLabel(h.damage)}`;

  root.NCD_HAZARDS = { DEFAULT_HIT, DEFAULT_DIFFICULTY, hazards, damageLabel, hazardTag };
})(globalThis);
