// Abilities: every perk and augmentation a character can pick. Edit this list to add more.
//
// Each entry:
//   id         what characters save; lowercase words joined by "-". Don't change one once it's in use.
//   type       "perk" or "augmentation". Augmentations always have an origin (and often an archetype);
//              perks have an origin or an archetype, never both.
//   name       as printed in the rulebook
//   origin     one of the origins in characters.js, or null
//   archetype  one of the archetypes in characters.js, or null
//   summary    optional: the one-line effect summary (plain text)
//   description optional: the full rules text, in the format.js format: blank lines between paragraphs,
//              "- " list lines, **bold**, *italic*, and icons: [advantage] [challenge] [boon] [drawback] [heat] [influence]
// Every entry needs a summary, a description, or both.
(function (root) {
  const cybernetic = (archetype, name, summary) => ({
    id: name.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, ""),
    type: "augmentation", name, origin: "Cybernetic", archetype, summary,
  });

  root.NCD_ABILITIES = [
    // ---- Cybernetic augmentations ----
    cybernetic("Assassin", "Active Camouflage", "Become invisible at-will"),
    cybernetic("Assassin", "Kinetic Trajectory Calculator", "Automatically deal wounds with melee attacks"),
    cybernetic("Assassin", "Target Prioritization Package", "Take an extra action to make a ranged attack"),
    cybernetic("Bruiser", "FastReact", "Always succeed on initiative"),
    cybernetic("Bruiser", "PalmPulse Projectors", "Project energy from your fists and feet"),
    cybernetic("Bruiser", "Piston Servos", "Round up the damage of melee damage to the nearest 10"),
    cybernetic("Doc", "Infravision", "See thermal output"),
    cybernetic("Doc", "SixthSense Extrapolation Chip", "Swap the digits of your crewmates' rolls to progress objectives"),
    cybernetic("Doc", "Weapon Mount", "Mount a weapon directly onto your body"),
    cybernetic("Gearhead", "Diagnostic Link", "Gain information about computer systems and gear"),
    cybernetic("Gearhead", "Nanohacking Manufactory", "Create a destructive cell of nanomachines"),
    cybernetic("Gearhead", "Nanoprinting Cloud", "Print objects you need using a cloud of nanites"),
    cybernetic("Grifter", "Anonymizer Package", "Do not add heat for creating legwork scenes in the world"),
    cybernetic("Grifter", "Mark Sensors", "Swap the digits of your rolls for mental attacks"),
    cybernetic("Grifter", "Subcutaneous Hive", "A hive embedded in your body that cannot be tampered with"),
    cybernetic("Hacker", "Familiar", "Gain an AI companion that performs simple tasks for you"),
    cybernetic("Hacker", "Firewall", "Protect yourself from digital attacks with temporary luck"),
    cybernetic("Hacker", "Lesser Program Memory", "Take out more minions with digital attacks"),
    cybernetic("Mastermind", "Comms Hub", "Coordinate your crew by routing their communications"),
    cybernetic("Mastermind", "Long-Term Storage", "Recall memories from deep storage to cancel drawbacks"),
    cybernetic("Mastermind", "Ride-Along Rig", "Stream sensory data from your crewmates"),
    cybernetic("Merc", "Aim-Steadying Servos", "Cancel drawbacks on ranged attack rolls"),
    cybernetic("Merc", "Complex Image Holoprojector", "Project vivid holograms"),
    cybernetic("Merc", "Smart Link", "Take out more minions with ranged attacks"),
    cybernetic("Operator", "Proximity Sensor Link", "Gain a pool of temporary luck to protect you while driving/piloting"),
    cybernetic("Operator", "Signal Jammer", "Force Administrator characters to re-roll"),
    cybernetic("Operator", "Vehicle Link", "Take an extra action to drive/pilot a vehicle"),
    cybernetic("Thief", "Drone Appendage", "Detach your hand or eye as drones"),
    cybernetic("Thief", "Manipulator Prosthetic", "Gain an extra arm to help with complex tasks"),
    cybernetic("Thief", "Retractable Wings", "Deploy steel wings to fly"),

    // ---- Gene-Spliced augmentations (archetypes not filled in yet) ----
    {
      id: "g-force-adaptation", type: "augmentation", name: "G-Force Adaptation", origin: "Gene-Spliced", archetype: null,
      description: `Your muscles, circulatory system, and the parietal cortex of your brain have been strengthened and reinforced by genetic manipulation, a series of enhancements originally developed for astronauts and space colonists. You do not gain challenge dice on any roll as a result of being subjected to high gravity. Additionally, when you are driving or piloting a vehicle, you add 2 challenge dice ([challenge][challenge]) to any physical attack roll made against you, due to the intense maneuvers your body is capable and executing.

When an enemy attacks you while you are driving or piloting a vehicle, you can choose to gain (or worsen) the **Exhausted** negative condition to add 4 challenge dice ([challenge][challenge][challenge][challenge]) to the roll instead of 2.`,
    },
    {
      id: "melanophore-control", type: "augmentation", name: "Melanophore Control", origin: "Gene-Spliced", archetype: null,
      description: `You can change the color and pattern of your skin at will, and can blend in against any unmoving background; in a conflict scene, doing so requires your action. Sensors within your clothing read signals from your skin and change color to match. While you are blending into the background, enemies add 2 challenge dice ([challenge][challenge]) to physical attacks made against you. This benefit ends when you move away from the object your are blending with.

You can also choose to gain (or worsen) the **Exhausted** negative condition to add 4 challenge dice ([challenge][challenge][challenge][challenge]) to the roll instead of 2.`,
    },
    {
      id: "hypertense-tendons", type: "augmentation", name: "Hypertense Tendons", origin: "Gene-Spliced", archetype: null,
      description: `Your muscles have been enhanced for extra speed and`,
    },
    {
      id: "musculoskeletal-chemical-refinement", type: "augmentation", name: "Musculoskeletal Chemical Refinement", origin: "Gene-Spliced", archetype: null,
      description: `The chemical channels that relay commands from your brain to your muscles has been streamlined, allowing you to strike out with exceptional speed. Hits with physical`,
    },
  ];
})(globalThis);
