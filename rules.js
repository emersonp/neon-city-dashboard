// Rulebook data for Create mode, transcribed from each archetype and origin section and "Making Your Crew Member".
// Edit this to fix a typo or add a rule; tests/rules.test.cjs checks it against characters.js and abilities.js.
// Needs characters.js loaded first (for the Mastermind's full Things You Know About list).
//
// archetypes[name]  pitch; intro (the opening paragraph); job ("What Does the … Do on the Job?": two {lead, items} lists);
//                   initiative {world, network} (50 is stored as null); skills {skillId: {value, adv, chal}}
//                   (value null is the book's "-"); knows {count, from}; gear: the starting gear lines, each
//                   {text, items} or {choose: [{text, items}]}, where items are templates (below).
// origins[name]     pitch; intro (the opening paragraph); xpTable (its Advancement table's number); advancement (the
//                   Advancement paragraph's last sentence); perksIntro (Synthetic: its character perks' intro);
//                   augmentations (granted automatically); options (the two optional choices), each with:
//   placements      intrinsic dice the player puts on skills: {key, kind: "adv" | "chal", count, category: "mental" | "physical",
//                   differentFrom?: key of an earlier placement that must go on a different skill}
//   extraAugmentation  true: pick a second starting augmentation      bumps {count, category}: +5% on that many different skills
//   luck            extra starting luck                               perk: id of the perk it grants
// augmentationGear  ability id -> the templates of the starting gear that augmentation adds. Weapon Mount only modifies an
//                   existing weapon, so it has none (gear.js handles it).
// text              the sentences every archetype or origin section repeats, so a fix to one is a fix to all.
// A template is { kind, name, quantity?, category? | categories?, keywords?, fixed?, pick?, set?, quality?, vehicle? | vehicles? }:
//   name is the item's starting name; keywords are the ones the book gives (removable later); fixed are granted against the
//   usual rules; pick is how many more keywords the player chooses; categories / vehicles are what the player chooses from.
//
// Gear wording follows the book; blanks like "of your choice" are kept as written.
(function (root) {
  const KNOWLEDGE = root.NCD_CHARACTERS.KNOWLEDGE;
  // starting gear: a line of book text and the items it gives; a prop line is its own item
  const line = (text, ...items) => ({ text, items });
  const prop = (text) => line(text, { kind: "prop", name: text.replace(/ \(prop\)$/, "") });
  const weapon = (name, category, more = {}) => ({ kind: "weapon", name, ...(category ? { category } : {}), ...more });
  const kit = (name, set, quality = "standard") => ({ kind: "kit", name, set, quality });
  const d = (key, kind, count, category, differentFrom) => ({ key, kind, count, category, ...(differentFrom ? { differentFrom } : {}) });
  // 2 dice on one skill and 1 on a different skill of the same category (keys a/b for challenge, c/d for advantage)
  const chal2 = (category) => [d("a", "chal", 2, category), d("b", "chal", 1, category, "a")];
  const adv2 = (category) => [d("c", "adv", 2, category), d("d", "adv", 1, category, "c")];

  const archetypes = {
    Assassin: {
      pitch: "Killers who make enemies go away…permanently.",
      intro: "You are the hitman. You can work independently, but when on a crew you are valued for your ability to quickly and quietly dispose of anyone who has become a problem. You are equally comfortable with blades or firearms, and specialize in reaching your targets unseen and unheard. While on a Job, you can be relied upon to gain access to secure locations, and if necessary eliminate the opposition with a minimal amount of danger to the crew.",
      job: [
        { lead: "As an assassin, you are often tasked with eliminating obstacles before they can become a problem during the execution of your crew's plan. Some suggestions for legwork scenes you might create include:", items: [
          "Locating and neutralizing (through violence, or otherwise) a head of security, bodyguard, or overseer",
          "Infiltrating a heavily-guarded facility to steal an asset that is crucial to your crew's plans",
          "Administering a poison to weaken someone who is an obstacle, or a mark, in the final scene",
          "Destroying a combat-ready security drone to weaken the defenses surrounding the mark",
        ] },
        { lead: "During other characters' legwork scenes, you might contribute to their success by:", items: [
          "Taking out an enemy serving as an obstacle to your crewmate's success",
          "Being on-hand in case the Administrator introduces an enemy character as a complication",
          "Pretending to attack your crewmate to give them a credible cover for a grift",
          "Acting as a lookout from a hidden position in order to keep a crewmate from being discovered",
        ] },
      ],
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
          line("A compact rail pistol (+20 damage, add 1 advantage die to attacks against far away targets, add 1 advantage die to rolls made to conceal the weapon)",
            weapon("Rail pistol", "Pistol", { keywords: ["Compact", "Rail"] })),
          line("Two plasma swords (+20 damage, one-handed melee weapon, deals 1 additional wound any time it wounds an enemy)",
            weapon("Plasma sword", "One-handed melee", { keywords: ["Plasma"], quantity: 2 })),
        ] },
        line("Five copies of a thrown weapon (+10 damage) of your choice", weapon("Thrown weapon", "Thrown", { quantity: 5 })),
        prop("A hooded cloak or long jacket that can completely conceal your body and keep your face shadowed (prop)"),
      ],
    },
    Bruiser: {
      pitch: "Enforcers who bring equal parts muscle and intimidation to the crew.",
      intro: "You're the muscle on your crew. You might be an underground pit fighter who needs only fists, feet, and a hard head to come out victorious on the other side of a fight. Perhaps you studied martial arts under the tutelage of a master, or maybe you earned your scars trading punches with corporate goons in run-down dive bars, or you could have learned the art of high frequency sword fighting as a part of formal paramilitary training. Regardless of your pedigree, you're a hell of a fighter, and most of the Right Kind of People would be thrilled to have you on their side in a scrap.",
      job: [
        { lead: "The bruiser isn't just a smasher who roughs people up; they keep the crew from being attacked in the first place. Some suggestions for legwork scenes you might create include:", items: [
          "Convincing members of the executive's security team to mysteriously \"come down sick\" the day the heist is to go off",
          "Seriously injure someone who threatens to interfere with the job",
          "Scare someone associated with the mark into giving up a critical piece of information",
          "Evaluating the site where the final scene is going to take place, looking for potential dangers",
        ] },
        { lead: "During other characters' legwork scenes, you might contribute to their success by:", items: [
          "Acting as a security detail to make sure no one messes with your fellow crew member",
          "Looming intimidatingly over your comrade's shoulder to put a threat behind their words",
          "Causing a distraction by creating a ruckus, like a bar fight or a street brawl",
          "Breaking down doors, smashing walls, and getting rid of other physical impediments",
        ] },
      ],
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
        line("Two different one-handed melee weapons, each with 1 additional keyword of your choice",
          weapon("Melee weapon", "One-handed melee", { pick: 1 }), weapon("Melee weapon", "One-handed melee", { pick: 1 })),
        prop("Leather jacket (prop)"),
        prop("Intimidating scars or visible damage to your default shell (prop)"),
      ],
    },
    Doc: {
      pitch: "The ones who keep the crew up and running at peak performance, or above.",
      intro: "You keep the crew's physical bodies running at peak performance. Your combination of medical knowledge and mechanical skill affords you the ability to maintain both the human and synthetic shells on your crew, and your capabilities extend beyond simply patching up wounds. You have a clear understanding of the way technology and biology can work together, allowing you to provide upgrades to your crew's shells that corporate medicine has deemed unprofitable or unsafe.",
      job: [
        { lead: "The Doc isn't just the crew's doctor; they are the engineer of the physical form, responsible for any connection between mind, body, and machine. Some suggestions for legwork scenes you might create include:", items: [
          "Sabotaging the body of an enemy while their mind is unloaded from it",
          "Acquiring a new and highly-capable shell for another crew member to use during the heist",
          "Stealing the schematics for a piece of bespoke cyberware that allows your crew to bypass a security system",
          "Breaking into a corporate hospital to steal doses of an inoculant against hazardous chemicals",
        ] },
        { lead: "During other characters' legwork scenes, you might contribute to their success by:", items: [
          "Being on hand to provide medical support when things turn violent",
          "Providing legitimacy to a crewmate's ruse when they pose as someone wounded or ill",
          "Creating a distraction by releasing a mild neurotoxin into the ventilation system of a building",
          "Identifying the weak spots in an enemy in the physical world",
        ] },
      ],
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
        line("A pistol with 1 keyword of your choice", weapon("Pistol", "Pistol", { pick: 1 })),
        prop("An outfit incorporating stained and stitched medical scrubs (prop)"),
        line("A standard paramedic's kit (+20 impact)", kit("Paramedic's kit", "Paramedic's Kit")),
      ],
    },
    Gearhead: {
      pitch: "Tinkerers who make sure the crew has the right tools for the job.",
      intro: "You are the tinkerer, the one who makes sure all of the guns, gear, and vehicles are ready to do the job you need them to do. You often act as the crew's quartermaster, making sure that everyone has what they need to succeed, and sometimes you find yourself taking on the role of mechanic, gunsmith, or even a doctor, patching up wounds on your human crewmates just like you patch up damage to the synthetic ones.",
      job: [
        { lead: "The gearhead makes sure that the crew has all of the tools they need, and often is responsible for the technical failures of their opposition. Some suggestions for legwork scenes you might create include:", items: [
          "Looking for exploitable design flaws in security technology and surveillance systems, then designing an exploit",
          "Building and placing an elaborate piece of technology that the crew will use in the final scene",
          "Acquiring contraband technology to outfit the crew",
          "Physically sabotaging security scanners to keep them from sounding the alarm when the crew arrives",
        ] },
        { lead: "During other characters' legwork scenes, you might contribute to their success by:", items: [
          "Sabotaging surveillance systems so that their comrade can operate without being observed",
          "Disabling police vehicles so that the crew can make a fast getaway without being pursued",
          "Jury-rigging a tool or piece of tech that one of their crewmates can use to open locked doors",
          "Analyzing blueprints and schematics for weaknesses that their fellow crew members can exploit",
        ] },
      ],
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
        line("A pistol with 2 keywords of your choice", weapon("Pistol", "Pistol", { pick: 2 })),
        prop("Coveralls or similar clothing, covered with grease stains and soldering iron burns (prop)"),
        line("A set of standard mechanic's tools (+20 impact)", kit("Mechanic's tools", "Mechanic's Tools")),
        prop("A pad filled with hundreds of half-finished schematics of your own design (prop)"),
      ],
    },
    Grifter: {
      pitch: "Con artists who act as the face of the crew.",
      intro: "You've been called a charmer, a huckster, a sham, a hustler, and a thousand other names, but it all comes down to being a confidence artist. You lull your targets into a false sense of trust and security and then extract what you want from them, leaving them confused or oblivious to your scheme. Once you identify your marks, you earn their trust, becoming their friends and confidants before betraying them at the right moment.",
      job: [
        { lead: "As the grifter, you are one of the primary \"face\" characters of the crew, excelling at social engineering and deception. Some suggestions for legwork scenes you might create include:", items: [
          "Securing access to a protected location by pretending to be a staff member or other approved employee",
          "Teasing critical information out of someone by convincing them that you are already in the know",
          "Impersonating a security chief, personal assistant, or other character that your crew previously neutralized so as not to arouse suspicions.",
          "Bolstering your crew's resources by running a con game on a low-level executive and siphoning off some of their wealth",
        ] },
        { lead: "During other characters' legwork scenes, you might contribute to their success by:", items: [
          "Distracting bodyguards or private security personnel while one of your crewmates sneaks by them",
          "Reinforcing the cover story a crewmate is using by pretending to come across them by accident",
          "Convincing bystanders not to report the suspicious activities of the crew",
          "Convincing someone at the security desk that your companion merely forgot their ID badge",
        ] },
      ],
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
        line("Two thrown weapons (+10 damage)", weapon("Thrown weapon", "Thrown", { quantity: 2 })),
        prop("Four sets of clothing, each tailored to a different social class and situation (prop)"),
        prop("A programmable makeup and tailoring kit (prop)"),
      ],
    },
    Hacker: {
      pitch: "Computer experts who make the Network their domain.",
      intro: "The digital realm is your domain and you play the virtual keyboard like a maestro, opening up files that would remain sealed to others and sifting through their precious data. You access information, overcome security systems, track things down, and generally hide your tracks from the Corporations and others who try and stop you. You're a virtual specter, gone with the swag before anyone even knows you were there. With your help, your crew can be in and out like a breeze without anyone the wiser.",
      job: [
        { lead: "In a world where computers are both ubiquitous and responsible for the smooth function of society, a hacker is a critical asset to any crew. Some suggestions for legwork scenes you might create include:", items: [
          "Introducing a virus into a security drone's operating system to neutralize an obstacle",
          "Breaking into a secure Network node to download crucial information on a mark",
          "Establishing false identification credentials for your crew, including a digital paper trail that gives their identities long histories",
          "Counterfeiting access cards to allow your crew to bypass security doors during the final scene",
        ] },
        { lead: "During other characters' legwork scenes, you might contribute to their success by:", items: [
          "Disabling security cameras to make it easier for a crewmate to infiltrate a location",
          "Running interference against moderation drones while your comrade scams someone in a Network node",
          "Creating a distracting by making a security system send out false alarm signals",
        ] },
      ],
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
          line("A standard hacker's deck", kit("Hacker's deck", "Hacker's Deck")),
          line("A standard commercial laptop (+20 impact)", kit("Commercial laptop", "Commercial Laptop")),
        ] },
        prop("A satchel or backpack (prop)"),
        line("A compact pistol (+20 damage, add 1 advantage die to rolls made to conceal the weapon)", weapon("Compact pistol", "Pistol", { keywords: ["Compact"] })),
      ],
    },
    Mastermind: {
      pitch: "The architects of complex schemes who always have a contingency plan.",
      intro: "No job goes well without a plan, and you are the person who hatches that plan. You have a mind for inventing complex schemes and intricate plots. You see the connections between people, places, and events in a complex web, and know how to formulate and execute a plan with many moving parts. You create plans that require precise timing, complex cons, and so many twists and turns that only you can see the full shape of it. Even when it looks like things are starting to fall apart, you reveal another facet of your plan that turns the tables.",
      job: [
        { lead: "The mastermind is often the crew's leader, someone who makes sure the pieces of the plan all fit together and that everyone contributes as befits their specialties. Some suggestions for legwork scenes you might create include:", items: [
          "Acquiring blueprints or schematics for a location where the job is going to take place to build out a plan",
          "Analyzing the security presence surrounding the target after seeing it first-hand",
          "Removing a potentially troublesome individual from the equation by convincing them to leave the city for a time",
          "Turning a potential threat into an asset by convincing them to join your side",
        ] },
        { lead: "During other characters' legwork scenes, you might contribute to their success by:", items: [
          "Overseeing their efforts and offering support and advice during the scene",
          "Making sure that all of the loose ends get tied up and no evidence is left behind",
          "Providing guidance on the best way to avoid a security system",
        ] },
      ],
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
        prop("Encoded database of schemes with an encryption key only you know (prop)"),
        prop("Signet ring or other identifying jewelry (prop)"),
        line("Walking cane (one-handed melee weapon, damage +10)", weapon("Walking cane", "One-handed melee")),
        prop("A bottle of real whiskey (prop)"),
      ],
    },
    Merc: {
      pitch: "Adaptable problem-solvers who are ready for anything.",
      intro: "Reliable, flexible, and adaptable: these are the traits that have kept you alive across jobs both dangerous and lucrative. You've sold your skills to anyone that could pay for it, and you have a reputation as someone that can be depended on to get the job done, no matter how little intel or resources you're given at the start. You find a way to succeed, and while some might call you a jack of all trades, in your case this is a selling point, making you the perfect addition to any crew.",
      job: [
        { lead: "The bruiser isn't just a smasher who roughs people up; they keep the crew from being attacked in the first place. Some suggestions for legwork scenes you might create include:", items: [
          "Scoping out a location when the crew doesn't know what's going on inside",
          "Accessing a Network node where the mark is known to do business",
          "Using physical violence to take down a bodyguard, security chief, or other personnel that stands in the way of the crew's plan",
          "Going into a dive bar in a rival crew's turf to convince them to set aside their plans for the crew's target",
        ] },
        { lead: "During other characters' legwork scenes, you might contribute to their success by:", items: [
          "Being on-hand to help out when the situation calls for a skill they don't possess",
          "Tackling unexpected obstacles that the crew couldn't have predicted",
          "Serving as an extra gun or pair of fists for when a fight inevitably breaks out",
          "Scouting ahead to make sure the coast is clear",
        ] },
      ],
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
        line("A pistol with 2 additional keywords of your choice and a rifle with 1 additional keyword of your choice",
          weapon("Pistol", "Pistol", { pick: 2 }), weapon("Rifle", "Rifle", { pick: 1 })),
        line("A one-handed melee weapon with 1 additional keyword of your choice", weapon("Melee weapon", "One-handed melee", { pick: 1 })),
        line("Three copies of a thrown weapon with 2 additional keywords of your choice", weapon("Thrown weapon", "Thrown", { quantity: 3, pick: 2 })),
        prop("Street clothes and a duster or leather jacket (prop)"),
      ],
    },
    Operator: {
      pitch: "Drivers and pilots that keep the crew from being caught by surprise.",
      intro: "You are the driver, the drone pilot, the robot jockey. If it rolls, flies, or travels on water, it's your tool for the using. You are the crew's escape hatch, responsible for making sure that no one gets caught while on the job. You are often entrusted with being the lookout and making sure that everyone sees trouble coming, and usually have a plan on hand to make sure that any unexpected hitches get smoothed out before they become a problem. Your natural talents as a driver translate well into the digital realm, and your skills often make you a tough competitor in digital racing and other esports.",
      job: [
        { lead: "When it comes to vehicles and drones, no one is better at getting what they want than the operator. Some suggestions for legwork scenes you might create include:", items: [
          "Hijacking a shipment of critical supplies as it enters or leaves the city",
          "Fly a spy drone into the upper, secure floors of a skyscraper to obtain a floor plan of the target space",
          "Stealing a security drone and modifying it to obey your commands instead of the security system's",
          "Kidnapping a VIP by running their armored limousine off the road and grabbing them from the wreckage",
        ] },
        { lead: "During other characters' legwork scenes, you might contribute to their success by:", items: [
          "Serving as a lookout in case there is unexpected trouble",
          "Being on-hand in scenes where the heat pool is large enough that the Administrator is likely to introduce a complication",
          "Using a drone to distract the guards and provide cover for your crewmate",
          "Being the getaway driver for your crewmates",
        ] },
      ],
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
        line("A pistol with 1 keyword of your choice", weapon("Pistol", "Pistol", { pick: 1 })),
        prop("Driving gloves, a helmet, and padded jumpsuit (prop)"),
        // "motorcycle" covers both bikes in the Garage
        line("A motorcycle, muscle car, or drift car", { kind: "vehicle", name: "Ride", vehicles: ["Chopper", "Street Bike", "Muscle Car", "Drift Car"] }),
        // the ranged categories that allow Mounted
        line("A mounted ranged weapon for your vehicle with 2 keywords of your choice",
          weapon("Vehicle weapon", null, { categories: ["Pistol", "Rifle", "Shotgun", "Launcher"], keywords: ["Mounted"], pick: 2 })),
      ],
    },
    Thief: {
      pitch: "Skulkers in the shadows that specialize in getting into secure places.",
      intro: "You are the sneak, the infiltrator, the light-fingered, clever-handed crew member with a knack for getting into places that are trying to keep you out. Anything the corporations try to protect, you want to take, and the security system hasn't been invented yet that is invulnerable to your kind. You are likely the most nimble member of the crew, and subtlety is your preferred methodology. Your best work is done when no one notices that you are even there, and most of your marks never notice that you've taken their valuables until you are already long gone.",
      job: [
        { lead: "The bruiser isn't just a smasher who roughs people up; they keep the crew from being attacked in the first place. Some suggestions for legwork scenes you might create include:", items: [
          "Breaking into the secure facility where the heist is going to go down and scouting the location for info",
          "Worming your way through utility conduits to sabotage a security system",
          "Getting close enough to a security chief to copy their hive's identifier codes without them noticing",
          "Stealing a valuable heirloom from an executive to use as leverage over them",
        ] },
        { lead: "During other characters' legwork scenes, you might contribute to their success by:", items: [
          "Cracking the locks on security doors to allow your crewmate access to a private area",
          "Breaking into the upper floor of the building and intentionally setting off alarms as a distraction for your comrades infiltrating a lower floor",
          "Lifting an identifying badge off of a guard to enhance a crewmate's disguise",
          "Infiltrating a secure server room to give your crew's hacker access to the system by proxy",
        ] },
      ],
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
        line("A pistol with the silent keyword", weapon("Silenced pistol", "Pistol", { keywords: ["Silent"] })),
        prop("Dark, close-fitting clothing (prop)"),
        // the book says "infiltrator's kit"
        line("A standard infiltrator's kit (+20 impact)", kit("Infiltration kit", "Infiltration Kit")),
        prop("An over-the-shoulder bag (prop)"),
      ],
    },
  };

  // Each origin's last Advancement sentence: which origins' body augmentations it can add.
  const HUMAN_ADVANCEMENT = "As a human, you will be able to add body augmentations to your default body from the Cybernetic, Gene-Spliced, and Psionic origins during advancement.";
  const SYNTHETIC_ADVANCEMENT = "As a synthetic intelligence inhabiting an artificial body, you will be able to add body augmentations to your default body from the Cybernetic and Synthetic origins during advancement.";

  const origins = {
    Cybernetic: {
      pitch: "Humans that make extensive use of computerized implants and other blends of technological hardware and biological host.",
      intro: "You are a biological human whose body has been enhanced with cybernetic implants, blending machinery and organics to upgrade your capabilities. Cybernetic enhancement is the most common form of body augmentation, and is unremarkable in larger society; even wealthy elites frequently have visible cybernetics.",
      xpTable: "3-2",
      advancement: HUMAN_ADVANCEMENT,
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
      intro: "Your body has been altered by biological engineering, splicing in artificial augmentations to your DNA derived from scientific research and replacing organs with vat-grown substitutes. These augmentations may have come from gene therapy, or from genetic engineering during your body's gestation. While you are still essentially human, your body has been upgraded through enough changes to your DNA and after-market organic grafts that your appearance may be truly striking.",
      xpTable: "3-3",
      advancement: HUMAN_ADVANCEMENT,
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
      intro: "Your mind has been opened to a higher level of perception, granting you access to unique abilities that come from within you. Nothing about your appearance gives an outward indication that you possess supernatural mental powers.",
      xpTable: "3-4",
      advancement: HUMAN_ADVANCEMENT,
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
      intro: "You are a synthetic intelligence that inhabits robotic bodies. You started out as an advanced self-enhancing program and, through a combination of machine learning and fortuitous data exposure, achieved true sentience and were recognized as a person under the Turing Accords. Your artificial body mimics human functionality and appearance, and though up close no one would mistake you for human you largely blend in with a crowd.",
      xpTable: "3-5",
      advancement: SYNTHETIC_ADVANCEMENT,
      perksIntro: "The following character perks are unique to synthetic characters that choose options during character creation to obtain them.",
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
    "echolocation": [weapon("Smoke grenade", "Thrown", { keywords: ["Explosive", "Obfuscating"], quantity: 2 })],
    "filtered-lungs": [weapon("Noxious gas grenade", "Thrown", { keywords: ["Explosive", "Debilitating"], quantity: 2 })],
    // two-handed melee can't normally be Mounted; this one is (fixed), +30 damage mounted
    "butcher-s-gauntlet": [weapon("Butcher's gauntlet", "Two-handed melee", { fixed: ["Mounted"], pick: 1 })],
    "transfigurable-weapon": [weapon("Transfigurable pistol", "Pistol", { keywords: ["Mounted"], pick: 2 })],
  };

  // The book's sentences that every archetype or origin section repeats, written once (format.js format).
  const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five"];
  const text = {
    knowsFrom: (count, list) => `Choose ${NUMBER_WORDS[count] ?? count} from the following list: ${list.join(", ")}`,
    knowsAny: (count) => `Choose **any ${count}** Things You Know About.`,
    initiative: "Set your starting initiative to the following values:",
    skills: "Mark the following starting values for your skills:",
    bumps: (count) => `Then choose **any ${count} skills** and increase them each by 5%.`,
    gear: "Add the following items to your character's equipment, and mark each of them as Starting Gear:",
    perks: (archetype) => `The following perks are ${archetype.toLowerCase()} archetype perks. When you first create your crew member, choose 1 of these perks to add to the character.`,
    creating: "When you first create a new member of the crew, follow these steps:",
    grantedAugmentation: (name) => `Add the ${name} augmentation to your default body`,
    chooseAugmentation: "Choose 1 of the starting body augmentations for your archetype and add it to your default body",
    options: "Additionally, you can optionally choose one of the following two choices (you can also elect not to take either option):",
    advancement: (table) => `At the end of each job, you will have the opportunity to spend XP to improve your character. The XP cost of various improvements is described on ${table}.`,
    xpTable: (number, origin) => `Table ${number}: ${origin} Character Advancement XP Expenditures`,
    augmentations: (origin) => `The following perks are ${origin.toLowerCase()} body augmentations.`,
  };

  root.NCD_RULES = { archetypes, origins, augmentationGear, text };
})(globalThis);
