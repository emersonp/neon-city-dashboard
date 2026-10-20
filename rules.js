// Rulebook data for Create mode, transcribed from each archetype and origin section and "Making Your Crew Member".
// Edit this to fix a typo or add a rule; tests/rules.test.cjs checks it against characters.js and abilities.js.
// Needs characters.js loaded first (for the Mastermind's full Things You Know About list).
//
// archetypes[name]  pitch; initiative {world, network} (50 is stored as null); skills {skillId: {value, adv, chal}}
//                   (value null is the book's "-"); knows {count, from}; gear (fixed lines, and {choose: [...]} groups).
// origins[name]     pitch; augmentations (granted automatically); options (the two optional choices), each with:
//   placements      intrinsic dice the player puts on skills: {key, kind: "adv" | "chal", count, category: "mental" | "physical",
//                   differentFrom?: key of an earlier placement that must go on a different skill}
//   extraAugmentation  true: pick a second starting augmentation      bumps {count, category}: +5% on that many different skills
//   luck            extra starting luck                               perk: id of the perk it grants
// augmentationGear  ability id -> starter gear lines that augmentation adds. Weapon Mount only modifies an existing weapon, so it has none.
//
// Gear wording follows the book; blanks like "of your choice" are kept as written.
(function (root) {
  const KNOWLEDGE = root.NCD_CHARACTERS.KNOWLEDGE;
  const d = (key, kind, count, category, differentFrom) => ({ key, kind, count, category, ...(differentFrom ? { differentFrom } : {}) });
  // 2 dice on one skill and 1 on a different skill of the same category (keys a/b for challenge, c/d for advantage)
  const chal2 = (category) => [d("a", "chal", 2, category), d("b", "chal", 1, category, "a")];
  const adv2 = (category) => [d("c", "adv", 2, category), d("d", "adv", 1, category, "c")];

  const archetypes = {
    Assassin: {
      pitch: "Killers who make enemies go away…permanently.",
      initiative: { world: 70, network: 50 },
      skills: {
        "case-the-joint": { value: 60, adv: 0, chal: 0 },
        "climb-jump-or-tumble": { value: 55, adv: 0, chal: 0 },
        "cover-your-tracks": { value: 55, adv: 1, chal: 0 },
        "gossip-with-corporates": { value: null, adv: 0, chal: 1 },
        "gossip-with-citizens": { value: null, adv: 0, chal: 2 },
        "play-a-game": { value: null, adv: 0, chal: 1 },
        "read-the-situation": { value: 55, adv: 0, chal: 0 },
        "shoot-someone": { value: 65, adv: 2, chal: 0 },
        "slash-stab-or-strike-someone": { value: 65, adv: 2, chal: 0 },
        "size-someone-up": { value: 60, adv: 0, chal: 0 },
        "sneak-around": { value: 65, adv: 2, chal: 0 },
        "throw-something": { value: 60, adv: 1, chal: 0 },
      },
      knows: { count: 3, from: ["Criminals", "Executives", "Medicine", "Psionics", "Weapons"] },
      gear: [
        { choose: [
          "A compact rail pistol (+20 damage, add 1 advantage die to attacks against far away targets, add 1 advantage die to rolls made to conceal the weapon)",
          "Two plasma swords (+20 damage, one-handed melee weapon, deals 1 additional wound any time it wounds an enemy)",
        ] },
        "Five copies of a thrown weapon (+10 damage) of your choice",
        "A hooded cloak or long jacket that can completely conceal your body and keep your face shadowed (prop)",
      ],
    },
    Bruiser: {
      pitch: "Enforcers who bring equal parts muscle and intimidation to the crew.",
      initiative: { world: 70, network: 55 },
      skills: {
        "analyze-data": { value: null, adv: 0, chal: 1 },
        "break-or-destroy-something": { value: 65, adv: 1, chal: 0 },
        "case-the-joint": { value: 55, adv: 0, chal: 0 },
        "fix-or-modify-something": { value: null, adv: 0, chal: 2 },
        "goad-someone": { value: 55, adv: 0, chal: 0 },
        "gossip-with-criminals": { value: 55, adv: 0, chal: 0 },
        "intimidate-someone": { value: 65, adv: 2, chal: 0 },
        "read-the-situation": { value: 60, adv: 0, chal: 0 },
        "size-someone-up": { value: 60, adv: 1, chal: 0 },
        "slash-stab-or-strike-someone": { value: 65, adv: 2, chal: 0 },
        "throw-money-at-the-problem": { value: null, adv: 0, chal: 1 },
        "tough-it-out": { value: 60, adv: 2, chal: 0 },
      },
      knows: { count: 3, from: ["Citizens", "Criminals", "Medicine", "Military", "Weapons"] },
      gear: [
        "Two different one-handed melee weapons, each with 1 additional keyword of your choice",
        "Leather jacket (prop)",
        "Intimidating scars or visible damage to your default shell (prop)",
      ],
    },
    Doc: {
      pitch: "The ones who keep the crew up and running at peak performance, or above.",
      initiative: { world: 70, network: 55 },
      skills: {
        "analyze-data": { value: 65, adv: 1, chal: 0 },
        "fix-or-modify-something": { value: 60, adv: 1, chal: 0 },
        "gossip-with-citizens": { value: 60, adv: 0, chal: 0 },
        "heal-someone": { value: 65, adv: 2, chal: 0 },
        "intimidate-someone": { value: null, adv: 0, chal: 2 },
        "lie-to-someone": { value: null, adv: 0, chal: 1 },
        "read-the-situation": { value: 55, adv: 0, chal: 0 },
        "run-like-hell": { value: 55, adv: 0, chal: 0 },
        "size-someone-up": { value: 65, adv: 2, chal: 0 },
        "slash-stab-or-strike-someone": { value: null, adv: 0, chal: 1 },
        "throw-money-at-the-problem": { value: 55, adv: 1, chal: 0 },
        "tough-it-out": { value: 60, adv: 2, chal: 0 },
      },
      knows: { count: 3, from: ["Cybernetics", "Genetics", "Medicine", "Psionics", "Robotics"] },
      gear: [
        "A pistol with 1 keyword of your choice",
        "An outfit incorporating stained and stitched medical scrubs (prop)",
        "A standard paramedic's kit (+20 impact)",
      ],
    },
    Gearhead: {
      pitch: "Tinkerers who make sure the crew has the right tools for the job.",
      initiative: { world: 70, network: 55 },
      skills: {
        "analyze-data": { value: 55, adv: 1, chal: 0 },
        "break-or-destroy-something": { value: 65, adv: 2, chal: 0 },
        "conceal-an-object": { value: 55, adv: 0, chal: 0 },
        "convince-someone": { value: null, adv: 0, chal: 1 },
        "crash-a-system": { value: 55, adv: 1, chal: 0 },
        "drive-or-pilot-something": { value: 60, adv: 2, chal: 0 },
        "fix-or-modify-something": { value: 65, adv: 2, chal: 0 },
        "gossip-with-criminals": { value: 65, adv: 0, chal: 0 },
        "heal-someone": { value: null, adv: 0, chal: 2 },
        "infiltrate-a-system": { value: null, adv: 0, chal: 1 },
        "slash-stab-or-strike-someone": { value: 60, adv: 0, chal: 0 },
        "tough-it-out": { value: 60, adv: 0, chal: 0 },
      },
      knows: { count: 3, from: ["Cybernetics", "Military", "Robotics", "Vehicles", "Weapons"] },
      gear: [
        "A pistol with 2 keywords of your choice",
        "Coveralls or similar clothing, covered with grease stains and soldering iron burns (prop)",
        "A set of standard mechanic's tools (+20 impact)",
        "A pad filled with hundreds of half-finished schematics of your own design (prop)",
      ],
    },
    Grifter: {
      pitch: "Con artists who act as the face of the crew.",
      initiative: { world: 65, network: 65 },
      skills: {
        "conceal-an-object": { value: 55, adv: 0, chal: 0 },
        "convince-someone": { value: 65, adv: 2, chal: 0 },
        "cover-your-tracks": { value: 60, adv: 0, chal: 0 },
        "crash-a-system": { value: null, adv: 0, chal: 2 },
        "distract-someone": { value: 60, adv: 0, chal: 0 },
        "fix-or-modify-something": { value: null, adv: 0, chal: 1 },
        "gossip-with-citizens": { value: 60, adv: 0, chal: 0 },
        "intimidate-someone": { value: null, adv: 0, chal: 1 },
        "lie-to-someone": { value: 65, adv: 2, chal: 0 },
        "run-like-hell": { value: 55, adv: 1, chal: 0 },
        "size-someone-up": { value: 65, adv: 2, chal: 0 },
        "throw-money-at-the-problem": { value: 55, adv: 1, chal: 0 },
      },
      knows: { count: 3, from: ["Citizens", "Corporations", "Criminals", "Executives", "Government"] },
      gear: [
        "Two thrown weapons (+10 damage)",
        "Four sets of clothing, each tailored to a different social class and situation (prop)",
        "A programmable makeup and tailoring kit (prop)",
      ],
    },
    Hacker: {
      pitch: "Computer experts who make the Network their domain.",
      initiative: { world: 55, network: 70 },
      skills: {
        "analyze-data": { value: 55, adv: 2, chal: 0 },
        "cover-your-tracks": { value: 60, adv: 1, chal: 0 },
        "crash-a-system": { value: 65, adv: 1, chal: 0 },
        "drive-or-pilot-something": { value: 55, adv: 0, chal: 0 },
        "gossip-with-citizens": { value: 55, adv: 0, chal: 0 },
        "gossip-with-criminals": { value: 60, adv: 0, chal: 0 },
        "infiltrate-a-system": { value: 65, adv: 2, chal: 0 },
        "intimidate-someone": { value: null, adv: 0, chal: 1 },
        "override-a-system": { value: 65, adv: 2, chal: 0 },
        "play-a-game": { value: 60, adv: 0, chal: 0 },
        "size-someone-up": { value: null, adv: 0, chal: 1 },
        "tough-it-out": { value: null, adv: 0, chal: 2 },
      },
      knows: { count: 3, from: ["Computers", "Cybernetics", "Network", "Security", "Vehicles"] },
      gear: [
        { choose: [
          "A standard hacker's deck",
          "A standard commercial laptop (+20 impact)",
        ] },
        "A satchel or backpack (prop)",
        "A compact pistol (+20 damage, add 1 advantage die to rolls made to conceal the weapon)",
      ],
    },
    Mastermind: {
      pitch: "The architects of complex schemes who always have a contingency plan.",
      initiative: { world: 65, network: 65 },
      skills: {
        "analyze-data": { value: 65, adv: 2, chal: 0 },
        "case-the-joint": { value: 60, adv: 2, chal: 0 },
        "conceal-an-object": { value: 55, adv: 0, chal: 0 },
        "convince-someone": { value: null, adv: 0, chal: 1 },
        "distract-someone": { value: 55, adv: 0, chal: 0 },
        "gossip-with-corporates": { value: null, adv: 0, chal: 2 },
        "gossip-with-citizens": { value: 55, adv: 1, chal: 0 },
        "gossip-with-criminals": { value: 60, adv: 0, chal: 0 },
        "intimidate-someone": { value: null, adv: 0, chal: 1 },
        "read-the-situation": { value: 65, adv: 2, chal: 0 },
        "size-someone-up": { value: 65, adv: 1, chal: 0 },
        "throw-money-at-the-problem": { value: 60, adv: 0, chal: 0 },
      },
      knows: { count: 4, from: KNOWLEDGE },
      gear: [
        "Encoded database of schemes with an encryption key only you know (prop)",
        "Signet ring or other identifying jewelry (prop)",
        "Walking cane (one-handed melee weapon, damage +10)",
        "A bottle of real whiskey (prop)",
      ],
    },
    Merc: {
      pitch: "Adaptable problem-solvers who are ready for anything.",
      initiative: { world: 65, network: 65 },
      skills: {
        "cover-your-tracks": { value: null, adv: 0, chal: 2 },
        "drive-or-pilot-something": { value: 60, adv: 0, chal: 0 },
        "goad-someone": { value: 60, adv: 2, chal: 0 },
        "gossip-with-citizens": { value: null, adv: 0, chal: 1 },
        "gossip-with-corporates": { value: 55, adv: 1, chal: 0 },
        "gossip-with-criminals": { value: 55, adv: 1, chal: 0 },
        "intimidate-someone": { value: 55, adv: 0, chal: 0 },
        "read-the-situation": { value: 65, adv: 0, chal: 0 },
        "shoot-someone": { value: 65, adv: 0, chal: 0 },
        "slash-stab-or-strike-someone": { value: 60, adv: 2, chal: 0 },
        "throw-money-at-the-problem": { value: null, adv: 0, chal: 1 },
        "tough-it-out": { value: 65, adv: 2, chal: 0 },
      },
      knows: { count: 3, from: ["Criminals", "Executives", "Medicine", "Psionics", "Weapons"] },
      gear: [
        "A pistol with 2 additional keywords of your choice and a rifle with 1 additional keyword of your choice",
        "A one-handed melee weapon with 1 additional keyword of your choice",
        "Three copies of a thrown weapon with 2 additional keywords of your choice",
        "Street clothes and a duster or leather jacket (prop)",
      ],
    },
    Operator: {
      pitch: "Drivers and pilots that keep the crew from being caught by surprise.",
      initiative: { world: 70, network: 55 },
      skills: {
        "case-the-joint": { value: 55, adv: 0, chal: 0 },
        "convince-someone": { value: null, adv: 0, chal: 1 },
        "cover-your-tracks": { value: 55, adv: 0, chal: 0 },
        "drive-or-pilot-something": { value: 65, adv: 2, chal: 0 },
        "fix-or-modify-something": { value: 65, adv: 1, chal: 0 },
        "read-the-situation": { value: 65, adv: 2, chal: 0 },
        "run-like-hell": { value: 60, adv: 2, chal: 0 },
        "override-a-system": { value: null, adv: 0, chal: 1 },
        "play-a-game": { value: 55, adv: 0, chal: 0 },
        "shoot-someone": { value: 60, adv: 0, chal: 0 },
        "sneak-around": { value: 60, adv: 1, chal: 0 },
        "throw-money-at-the-problem": { value: null, adv: 0, chal: 2 },
      },
      knows: { count: 3, from: ["Computers", "Military", "Robotics", "Vehicles", "Weapons"] },
      gear: [
        "A pistol with 1 keyword of your choice",
        "Driving gloves, a helmet, and padded jumpsuit (prop)",
        "A motorcycle, muscle car, or drift car",
        "A mounted ranged weapon for your vehicle with 2 keywords of your choice",
      ],
    },
    Thief: {
      pitch: "Skulkers in the shadows that specialize in getting into secure places.",
      initiative: { world: 70, network: 55 },
      skills: {
        "case-the-joint": { value: 60, adv: 1, chal: 0 },
        "climb-jump-or-tumble": { value: 65, adv: 0, chal: 0 },
        "conceal-an-object": { value: 65, adv: 2, chal: 0 },
        "convince-someone": { value: null, adv: 0, chal: 1 },
        "distract-someone": { value: 55, adv: 0, chal: 0 },
        "gossip-with-corporates": { value: null, adv: 0, chal: 2 },
        "gossip-with-criminals": { value: 60, adv: 2, chal: 0 },
        "infiltrate-a-system": { value: 55, adv: 0, chal: 0 },
        "play-a-game": { value: 60, adv: 1, chal: 0 },
        "shoot-someone": { value: 55, adv: 0, chal: 0 },
        "sneak-around": { value: 65, adv: 2, chal: 0 },
        "tough-it-out": { value: null, adv: 0, chal: 1 },
      },
      knows: { count: 3, from: ["Computers", "Corporations", "Criminals", "Security", "Vehicles"] },
      gear: [
        "A pistol with the silent keyword",
        "Dark, close-fitting clothing (prop)",
        "A standard infiltrator's kit (+20 impact)",
        "An over-the-shoulder bag (prop)",
      ],
    },
  };

  const origins = {
    Cybernetic: {
      pitch: "Humans that make extensive use of computerized implants and other blends of technological hardware and biological host.",
      augmentations: [],
      options: [
        { id: "chop-shop", name: "Chop Shop Cybernetics",
          text: "You have had some cybernetic enhancements installed at an illegal chop shop, illicit surgical facilities not known for their high-quality components or sanitary medical practices. Fill in 2 intrinsic challenge dice on one of your mental skills, and 1 intrinsic challenge die on one of your physical skills. Then, choose a second starting body augmentation for your archetype and add it to your default body.",
          placements: [d("a", "chal", 2, "mental"), d("b", "chal", 1, "physical")], extraAugmentation: true },
        { id: "new-game-plus", name: "New Game+",
          text: "You lived a full life in a different body, and have recently loaded into your default body for the first time, which is disorientingly different than your last body. Fill in 2 intrinsic challenge dice on one of your physical skills, and 1 intrinsic challenge die on a different physical skill. Fill in 2 intrinsic advantage dice on one of your physical skills, and 1 intrinsic advantage die on a different physical skill.",
          placements: [...chal2("physical"), ...adv2("physical")] },
      ],
    },
    "Gene-Spliced": {
      pitch: "People whose genetic makeup has been altered and enhanced to produce something more than human.",
      augmentations: [],
      options: [
        { id: "artificial-lycanthropy", name: "Artificial Lycanthropy",
          text: "Your biology has been altered by combining your DNA with select extractions from animal DNA, giving you a semi-bestial appearance. Fill in 2 intrinsic challenge dice on one of your mental skills, and 1 intrinsic challenge die on one of your physical skills. Then, increase the chance of success of 2 of your physical skills by 5%.",
          placements: [d("a", "chal", 2, "mental"), d("b", "chal", 1, "physical")], bumps: { count: 2, category: "physical" } },
        { id: "genome-engineering", name: "Genome Engineering",
          text: "Your body has been engineered on the genetic level, forcing an evolutionary leap before your body even began incubation. Fill in 2 intrinsic challenge dice on one of your mental skills, and 1 intrinsic challenge die on a different mental skill. Fill in 2 intrinsic advantage dice on one of your physical skills, and 1 intrinsic advantage die on a different physical skill.",
          placements: [...chal2("mental"), ...adv2("physical")] },
      ],
    },
    Psionic: {
      pitch: "Individuals whose minds have been awakened to a higher level of awareness, granting them psionic powers.",
      augmentations: [],
      options: [
        { id: "born-this-way", name: "Born this Way",
          text: "You have always been able to do things other people could not, your mind naturally capable of bending reality to your whims. Fill in 2 intrinsic challenge dice on one of your physical skills, and 1 intrinsic challenge die on a different physical skill. Fill in 2 intrinsic advantage dice on one of your mental skills, and 1 intrinsic advantage die on a different mental skill.",
          placements: [...chal2("physical"), ...adv2("mental")] },
        { id: "moment-of-clarity", name: "Moment of Clarity",
          text: "You had no knowledge of your psionic prowess until, in a single moment, your third eye opened and increased your perception of the world around you. Fill in 2 intrinsic challenge dice on one of your mental skills, and 1 intrinsic challenge die on a different mental skill. Then, increase your starting luck by 20.",
          placements: chal2("mental"), luck: 20 },
      ],
    },
    Synthetic: {
      pitch: "Sentient artificial intelligences inhabiting robotic bodies.",
      augmentations: ["synthetic-body"],
      options: [
        { id: "network-native", name: "Network Native",
          text: "You were a program with a wholly-digital presence before achieving sentience, and are most comfortable in purely-digital environments. Fill in 2 intrinsic challenge dice on one of your physical skills, and 1 intrinsic challenge die on a different physical skill. Then, add the Installation Wizard character perk to your character.",
          placements: chal2("physical"), perk: "installation-wizard" },
        { id: "ascended-robot", name: "Ascended Robot",
          text: "Before achieving sentience, you were an AI that controlled a robot, and thus are comfortable in physical form. Fill in 2 intrinsic challenge dice on one of your mental skills, and 1 intrinsic challenge die on a different mental skill. Then, add the Device Driver character perk to your character.",
          placements: chal2("mental"), perk: "device-driver" },
      ],
    },
  };

  // Augmentations whose text adds something to your starting gear (found by searching abilities.js for "starting gear").
  const augmentationGear = {
    "echolocation": ["2 smoke grenades (thrown weapons with the explosive and obfuscating keywords)"],
    "filtered-lungs": ["2 noxious gas grenades (thrown weapons with the explosive and debilitating keywords)"],
    "butcher-s-gauntlet": ["A two-handed melee weapon with the Mounted keyword (+30 damage when mounted, only +20 if you remove it) and 1 additional keyword of your choice"],
    "transfigurable-weapon": ["A pistol with the Mounted keyword, plus 2 keywords of your choice"],
  };

  root.NCD_RULES = { archetypes, origins, augmentationGear };
})(globalThis);
