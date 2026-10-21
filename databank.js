// The Databank tab's reference text, from the rulebook's Equipment chapter: gear (tools, specialized equipment, weapons,
// vehicles) and keywords (gear and weapon); and the skill descriptions from its Skills section. No page code here, so it can be tested in Node.
// Text uses the format.js description format: paragraphs, "- " lists, **bold**, *italic*, and [advantage]-style icons.
// Wording follows the book, with its own typos fixed where they'd mislead.
//
// gear            sections: { title, intro?, entries: [{ name, tag?, text, table?, reference?, choice? }] }
//                 a table is { head: [...], rows: [[...]] } of plain text; reference: true for entries that aren't gear you can own;
//                 choice: what owning one needs picked, { label, skill: true } or { label, options: [...] }
// armor           body armor, one entry like those in gear (it goes in the Armory with the weapons), plus levels:
//                 the keywords Armored x1-x4 add
// toolSets        the specialized tool sets: { name, skills: [skill ids] }
// weapons         the weapon categories: hands (1 or 2, null if the book doesn't say), damage bonus, intrinsic keywords,
//                 the keywords each category allows, and examples
// vehicleRules    the general vehicle rules (a list), vehicles: { name, size, blurb, text }
// keywords        { positive, negative, weapon }: [{ name, text, notOn?, excludes?, requires? }]
//                 notOn: "weapon" / "vehicle" can't have it; excludes: can't share an item with these (either way round);
//                 requires: only on an item that also has these; damage / hands: what a weapon keyword changes
//                 (tool kit quality entries likewise carry quality and impact)
// skills          sections like gear's: mental skills, physical skills, and Anything Else (an intro, no entries)
(function (root) {
  const gear = [
    {
      title: "Gear basics",
      intro: "Most pieces of gear either have their own mechanics as described in their entry, or no mechanics at all (props). These systems can apply to any piece of gear as needed.",
      entries: [
        {
          name: "Breaking & Repairing Gear",
          reference: true,
          text: `Typically, you do not need to track the everyday wear and tear on the gear you are using. Sometimes, however, the Administrator might choose to have your bad luck affect your gear instead of you directly.

Whenever you roll a drawback ([drawback]) on a roll while using a piece of gear, the Administrator can choose for the effect of that drawback to be the piece of gear gaining (or worsening) the **Damaged** negative condition. If the piece of gear already has the condition at x4 severity, the piece of gear instead becomes **broken**.

A broken piece of gear cannot be used until it is repaired; repairing the object requires spending a montage action working on it and making a successful **Fix or Modify Something** roll, which removes the Damaged condition from the item or repairs it if it is broken.`,
        },
        {
          name: "Common Gear",
          reference: true,
          text: `Some perks and montage actions refer to common gear as a category. Broadly speaking, common gear encompasses the following objects:
- Weapons with no additional keywords (except for sniper rifles, launchers, and mines, which are never considered to be common)
- Consumer goods and tools available through normal retail channels to citizens
- Basic guided skill software
- Improvised tools
- Consumable standard tools
- Specialized equipment that explicitly states that it is common in its description`,
        },
        {
          name: "Props",
          reference: true,
          text: `Props are a special category of gear that have no intrinsic mechanics of their own, but are instead intended to provide inspiration for what your character does and how they go about doing it. They can be just about anything other than the gear specifically called out in this chapter, purely decorative or with some simple function that doesn't warrant its own mechanics. Many of the pieces of starting gear provided by your archetype will be props, and they will be labeled as such.

If the prop is exceptionally well-suited to helping you succeed at some task you are attempting, the Administrator can grant you 1 advantage die ([advantage]) on a roll you are making as a part of that attempt if your description makes use of that item, though this is purely at the Administrator's discretion and should not be expected.`,
        },
      ],
    },
    {
      title: "Guided skill software",
      intro: "Programs that run on your hive and implant temporary memories of training in a skill. You keep the benefit until the end of the scene in which you use it, and each instance is single-use.",
      entries: [
        {
          name: "Rules",
          reference: true,
          text: `- Each instance is associated with a single skill
- The software overrides your own chance of success with that skill
- When you make a check using that skill while you have guided skill software installed, you do not check the "used" checkbox for that skill`,
        },
        { name: "Basic", tag: "60% · common", choice: { label: "Skill", skill: true }, text: "This software grants the user a 60% chance of success in the chosen skill. Basic skill software is considered to be common gear." },
        { name: "Advanced", tag: "70%", choice: { label: "Skill", skill: true }, text: "This software grants the user a 70% chance of success in the skill. However, if the user by default has less than a 60% chance of success with that skill, they also roll 1 challenge die ([challenge]) as they lack the experience with the basic principles of that skill and are prone to mistakes." },
        { name: "Expert", tag: "80%", choice: { label: "Skill", skill: true }, text: "This software grants the user an 80% chance of success in the skill. However, if the user by default has less than a 70% chance of success with that skill, they also roll 2 challenge dice ([challenge][challenge]) as they lack the experience with intermediary techniques for that skill and are prone to mistakes." },
      ],
    },
    {
      title: "Specialized tool kits",
      double: true, // long: two columns wide where the page has room
      intro: "When you use a tool set to help progress a scene objective with one of its associated skills, it adds a bonus to the impact of the roll. Each set comes in one of three qualities.",
      entries: [
        { name: "Improvised Tools", quality: "improvised", impact: 10, tag: "+10 impact · common", text: "Usually incomplete sets of commercially-available tools, or kitbashed tools with a more specialized purpose assembled from spare parts. Improvised tool sets grant a **+10** bonus to impact, but can be carried in pockets or in a backpack or satchel without arousing any suspicion or being particularly cumbersome. Improvised tools are considered to be common gear." },
        { name: "Standard Tools", quality: "standard", impact: 20, tag: "+20 impact", text: "Typically mass-produced tools that have been well cared for, kept together, and perhaps personalized by the owner. They grant a **+20** bonus to impact, but typically require their own case or bag that must be carried in one hand." },
        { name: "Exceptional Tools", quality: "exceptional", impact: 30, tag: "+30 impact", text: "Lovingly-made tools that are either costly or difficult to get a hold of, and may be the handiwork of a craftsperson of exceptional skill. They grant a **+30** bonus to impact, but typically require a large carrying case that must be either carried in two hands or transported by vehicle." },
        {
          name: "Hyper-Specialized Tools",
          reference: true,
          text: `For each tool set, a hyper-specialized tool exists that grants its impact bonus to only one of the associated skills (and no bonus to the other skills from the base tool set). However, hyper-specialized tool sets also have the **Right Tool for the Job x2** intrinsic positive condition.

For example, a *hyper-specialized standard hacker's deck (Crash a System)* grants a +20 bonus to the impact of a Crash a System roll to progress an objective, and adds 2 advantage dice ([advantage][advantage]) to all rolls made while using it.`,
        },
        { name: "Consumable Tools", reference: true, text: "Single-use tools that are destroyed or otherwise made unusable by the action in which you gain their benefit. Consumable tools are almost always either of standard or exceptional quality, and can be hyper-specialized. Standard-quality consumable tools are considered to be common gear." },
        // The table is built from toolSets (below) by the page.
        { name: "Tool Sets", reference: true, text: "The tool sets available, and the skills each one helps." },
      ],
    },
    {
      title: "Targeted stimulants",
      entries: [
        {
          name: "Targeted Stimulant",
          choice: { label: "Skill", skill: true },
          text: `Each dose delivers a specialized chemical payload that briefly boosts specific organs and centers of the brain. A targeted stimulant has a single skill associated with it as its beneficiary skill. After using one (via inhaler, dermal patch, injection, or some other user-triggered method that does not require an action during a conflict scene), until the end of the scene you add 4 advantage dice ([advantage][advantage][advantage][advantage]) to all rolls made with that skill.

Each also has side effects: you gain a negative condition for the rest of the scene, chosen by the Administrator when the beneficiary skill is chosen:
- Decreased Perception x2
- Depleted Focus x2
- Dulled Reflexes x2
- Impaired Communication x2
- Severe Physical Fatigue x2
- Unpredictable Mood Swings x2
- Unreliable Judgment x2`,
        },
      ],
    },
    {
      title: "Computer gear",
      entries: [
        { name: "Blizzard", tag: "consumable", text: "An unobtrusive jammer that floods all standard wireless bands with junk data. Narrow-band, tightly-encrypted signals (such as those between a hive and a connected swarm) are uninterrupted. Once activated (requiring an action during a conflict scene), all attempts at wireless communication at the same location as the blizzard until the end of the scene automatically fail. This is a one-use, consumable device that burns itself out and cannot be repaired." },
        { name: "Data Airlock", text: "A buffer between a computer and the outside world: any connection made to the machine must go through it, and it can detect and isolate malicious actors before their data pass through. A computer with an anti-intrusion firewall has the **Firewalled x2** intrinsic positive condition, which acts as a negative condition for enemies making digital attacks against you in the physical world. Additionally, if you overlay a quick avatar sheet, check one Antivirus installed software box on that sheet." },
        { name: "Data Stick", text: "A delicate circuit connected to a small block of solid-state memory, built into a plastic wafer smaller than an adult's finger. Data sticks are the most common way to transfer software and programs without allowing a direct connection between machines." },
        { name: "Haptic Network Kit", text: "A lightweight motion-tracking headset, a pair of wireless haptic gloves, and enough processing power to manifest an avatar in the Network: a primitive but risk-free way to traverse it without exposing your hive, or your mind, to tampering or malicious hackers. When using a haptic Network kit instead of a Network terminal during a scene in a Network node, you have the **Not Really Here x2** negative condition, which also acts as a negative condition for anyone making a mental attack against you." },
        { name: "Hive Interface Wire", text: "Connects a computer system directly to your hive, so you can interface with it via the HUD your swarm projects over your vision: useful for systems with no obvious interface devices. If this equipment has the Cybernetic keyword, you can describe it as a cord that extends from your wrist or fingertip, connecting to your swarm via your central nervous system. When using a hive interface wire, you have the **Direct Connection** positive condition, which also acts as a positive condition for anyone attempting to make a digital attack against you through the system you are connected to." },
        { name: "Ripcord", text: "A bridge between a Network terminal and your hive, preventing you from being locked into the Network or suffering neural trauma while connected. While using a ripcord during a scene in the Network, if the Administrator introduces the **Locked Down** complication you may, at any time, exit the scene without taking any Wounds from the complication." },
        { name: "Stowaway Signaler", tag: "consumable", text: "A small wireless device that lets you remotely connect to a hardwired or airgapped computer. It simulates a physical interface and streams audio and video back to the connecting user, fooling the system into thinking a user is present with a hardwired connection. It must be physically attached to the computer at a point where other interface devices would normally be connected. This is a one-use, consumable device that burns itself out and cannot be repaired." },
        { name: "Tablet", tag: "common", text: "A catch-all term for any simple, handheld computer built into a display. Tablets still see extensive use for sharing and visualizing data with anyone you don't trust to pipe data directly to your HUD, and by people whose swarms haven't been injected yet. They accept standard data sticks as well as wired connections from other computers. Tablets are considered common gear." },
      ],
    },
    {
      title: "Biotechnology",
      entries: [
        {
          name: "Environment Suit",
          choice: { label: "Environment", options: ["Underwater", "Space vacuum", "Extreme heat or cold", "Chemically toxic/radioactive environment", "Non-Earth planet/moon/asteroid surface"] },
          text: `Covers the wearer from head to toe: cumbersome, but essential protection. Each environment suit is tailored to one environment, chosen when it is acquired:
- Underwater
- Space vacuum
- Extreme heat or cold
- Chemically toxic/radioactive environment
- Non-Earth planet/moon/asteroid surface

Environment suits impose the **Heavily Encumbered** negative condition on the wearer, and make the wearer immune to hazards that are endemic to the environment for which the suit is tailored.`,
        },
        { name: "Life Support Suit", text: "Closer to cybernetics than to equipment: a full-body worn device that provides critical medical intervention for someone whose body can no longer sustain their own life. Suits come in human and synthetic varieties, and only work for individuals of that type. A character wearing a life support suit cannot take wounds from poisons, diseases, their own cybernetic implants, or any effect that would cause wounds without taking physical damage. They do not need to eat, and also have the **Heavily Encumbered x4** negative condition. A suit can run for up to ten days before it must be replaced or its chemicals and nanites replenished." },
        { name: "Smart Dosage Inhaler", tag: "consumable", text: "An inhaler with an onboard computer and wireless networking that talks to your swarm, adjusting its dosage from your physiological data and helping your nanites deliver the payload. Any negative conditions imposed by the payload of this inhaler are reduced by 1 step (removing it entirely for most non-worsened conditions). This is a one-use, consumable device that delivers its payload and cannot be repaired." },
        { name: "Stasis Container", text: "A small, handheld device that preserves biological matter, keeping cloned organs, samples, and other living tissue alive during transport. Items in stasis containers do not appreciably age, and a stasis container can sustain its cargo for up to ten days without replacement or replenishment." },
      ],
    },
    {
      title: "Other tools",
      entries: [
        { name: "Bug Spray", tag: "consumable", text: "Slang for a small, handheld device that emits a short-range burst of electromagnetism capable of shorting out nanomachines. It has enough battery for a single burst, and is harmless to anything other than free-floating nanite clouds (like those used for nanoprinting); the swarms inside people's bodies are safe. In a conflict scene, activating bug spray requires an action, and the burst destroys any free-floating nanite clouds that are up close to the user." },
        {
          name: "Handheld Scanner",
          choice: { label: "Energy", options: ["Electricity/electromagnetic fields", "Ultraviolet light", "Thermal energy/temperature", "Radiation", "Psionic energy", "Motion", "Sound/vibration"] },
          text: `Held in one hand, it either passively detects what it's meant to detect anywhere up close or near to it, or can be focused into a tight beam to detect it even far away (focusing the beam in a direction takes an action during a conflict scene). Each scanner is keyed to one type of energy or wave, chosen when it is acquired:
- Electricity/electromagnetic fields
- Ultraviolet light
- Thermal energy/temperature
- Radiation
- Psionic energy
- Motion
- Sound/vibration`,
        },
        { name: "Personal Hologram Projector", text: "Small enough to fit in the palm of your hand, it projects a three-dimensional hologram about two inches above its surface. The holograms are no larger than a clenched fist and low enough in resolution that they can't be confused with a real object. They're often used to display an object for informational purposes, and some hackers use them to let their familiars be seen and communicate with people in the physical world." },
        { name: "Psionic Scrambler", text: "A wearable device resembling a delicate metal headband that scrambles the electromagnetic signals of the wearer's brainwaves. An individual wearing a psionic scrambler is immune to mental attacks from psionic augmentations, and their surface thoughts cannot be read by any psionic augmentations or other abilities." },
        { name: "Sarcophagus", text: "An extremely well-protected briefcase for carrying a data drive that holds an individual's backed-up mind (their ghost) without risking data corruption. It is shielded against extreme heat, radiation, electromagnetic energy, vibration, and other sources of digital damage, and can safely absorb intense kinetic damage: a sarcophagus could survive an air vehicle crash with no damage to the ghost within." },
        { name: "Wheels", text: "A personal ground conveyance, smaller than a motorcycle but faster than walking: a self-balancing scooter, an electric unicycle, zero-friction rollerblades, and so on (the exact form is chosen when it is acquired). While using one, you can travel at a speed comparable to a small ground vehicle like a motorcycle. It does not do well in rough terrain, and is too cumbersome to be of use in a fight." },
      ],
    },
  ];

  const armor = {
    name: "Body Armor",
    text: "Wearing body armor gives you the **Armored** intrinsic positive condition, which acts as a negative condition for enemies making physical attacks against you. Heavier varieties increase the strength of the Armored condition but add extra keywords to the armor.",
    // the keywords each level adds, Armored (x1) to x4; the page builds the table from these
    levels: [[], ["Expensive"], ["Expensive", "Bulky"], ["Expensive", "Bulky", "Complicated"]],
  };

  // Specialized tool kits: each set and the skill ids it helps (NCD_CHARACTERS.SKILLS)
  const toolSets = [
    { name: "Commercial Laptop", skills: ["analyze-data", "cover-your-tracks", "play-a-game"] },
    { name: "Hacker's Deck", skills: ["crash-a-system", "infiltrate-a-system", "override-a-system"] },
    { name: "Infiltration Kit", skills: ["case-the-joint", "climb-jump-or-tumble", "sneak-around"] },
    { name: "Mechanic's Tools", skills: ["break-or-destroy-something", "drive-or-pilot-something", "fix-or-modify-something"] },
    { name: "Overwatch Supplies", skills: ["distract-someone", "read-the-situation", "run-like-hell"] },
    { name: "Paramedic's Kit", skills: ["heal-someone", "size-someone-up", "tough-it-out"] },
    { name: "Smuggler's Pack", skills: ["conceal-an-object", "lift-or-move-something", "throw-money-at-the-problem"] },
  ];

  const weapons = [
    { name: "One-handed melee", hands: 1, damage: 10, intrinsic: ["Compact", "Silent"],
      allowed: ["Armor-Piercing", "Compact", "Concussive", "Debilitating", "Electromagnetic", "Fusion", "Jagged", "Laser", "Mounted", "Nonlethal", "Plasma", "Shock", "Silent"],
      examples: "Knives, short swords, clubs, crowbars, batons, combat gloves, metal knuckles, lead pipes, a reinforced motorcycle helmet." },
    { name: "Two-handed melee", hands: 2, damage: 20, intrinsic: ["Silent"],
      allowed: ["Armor-Piercing", "Concussive", "Debilitating", "Electromagnetic", "Fusion", "Jagged", "Laser", "Nonlethal", "Plasma", "Shock", "Silent"],
      examples: "Long swords, staffs, polearms, a sharpened street sign." },
    { name: "Thrown", hands: null, damage: 10, intrinsic: ["Compact", "Close Range"],
      allowed: ["Close Range", "Compact", "Concussive", "Debilitating", "Electromagnetic", "Explosive", "Flechette", "Fusion", "Jagged", "Laser", "Nonlethal", "Obfuscating", "Phasing", "Plasma", "Proximity", "Shock", "Silent"],
      examples: "Throwing knives, shurikens, glass bottles, bricks." },
    { name: "Pistol", hands: 1, damage: 20, intrinsic: [],
      allowed: ["Armor-Piercing", "Automatic", "Compact", "Concussive", "Electromagnetic", "Explosive", "Flechette", "Fusion", "Laser", "Mounted", "Nonlethal", "Phasing", "Plasma", "Rail", "Shock", "Silent"],
      examples: "Revolvers, derringers, blowback-action pistols, sporting pistols, hand cannons." },
    { name: "Rifle", hands: 2, damage: 30, intrinsic: [],
      allowed: ["Armor-Piercing", "Automatic", "Concussive", "Electromagnetic", "Explosive", "Flechette", "Fusion", "Laser", "Miniaturized", "Mounted", "Nonlethal", "Phasing", "Plasma", "Rail", "Shock", "Silent"],
      examples: "Battle rifles, hunting rifles, assault rifles, scout rifles, carbines, sporting rifles." },
    { name: "Shotgun", hands: 2, damage: 40, intrinsic: ["Close Range"],
      allowed: ["Armor-Piercing", "Automatic", "Close Range", "Compact", "Concussive", "Debilitating", "Electromagnetic", "Explosive", "Flechette", "Fusion", "Miniaturized", "Mounted", "Nonlethal", "Phasing", "Plasma"],
      examples: "Break action, pump action, double-barreled, sawed-off, lever-action, and semi-automatic shotguns." },
    { name: "Sniper rifle", common: false, hands: 2, damage: 40, intrinsic: ["Long Range"],
      allowed: ["Armor-Piercing", "Explosive", "Fusion", "Laser", "Long Range", "Miniaturized", "Nonlethal", "Phasing", "Plasma", "Rail", "Silent"],
      examples: "Bolt-action rifles, designated marksman's rifles, anti-materiel rifles." },
    { name: "Launcher", common: false, hands: 2, damage: 20, intrinsic: ["Explosive", "Long Range", "Slow"],
      allowed: ["Concussive", "Debilitating", "Electromagnetic", "Explosive", "Long Range", "Miniaturized", "Mounted", "Plasma", "Rail", "Slow"],
      examples: "Rocket-propelled grenade launchers, rocket launchers, bazookas, missile launchers, mortars." },
    { name: "Mine", common: false, hands: 1, damage: 20, intrinsic: ["Explosive", "Stationary"],
      allowed: ["Activated", "Compact", "Concussive", "Debilitating", "Electromagnetic", "Explosive", "Flechette", "Laser", "Obfuscating", "Plasma", "Proximity", "Shock", "Stationary"],
      examples: "Land mines, C4, anti-vehicle mines." },
  ];
  const weaponsIntro = "Every weapon in a category has the same mechanics except when modified by additional keywords; the exact shape of an individual weapon is up to you and the Administrator. Intrinsic keywords are always on every weapon of that type. Weapons with no additional keywords are common gear, except sniper rifles, launchers, and mines, which never are.";

  const vehicleRules = `Vehicles are treated like gear: they modify the way a character interacts with the world, and how the world interacts with them.
- Attacks from outside of a vehicle are made against the vehicle's occupants, not the vehicle itself (all rules below mentioning attacks assume the attack is coming from outside of the vehicle)
- Occupants completely enclosed within a vehicle cannot be attacked, except for the driver or pilot
- Vehicle occupants can make attacks with mounted weapons they control or with personal weapons (if they are not completely enclosed by the vehicle); vehicles do not attack on their own
- The pilot or driver can use their action to attack with a mounted weapon and use their movement to move the entire vehicle; they can also use their action to ram, making a **Drive or Pilot Something** roll to make a melee attack
- Some hazards require the driver or pilot to use their action to Drive or Pilot Something to avoid the hazard
- Size differences between the vehicle and a physical attacker or target add advantage ([advantage]) or challenge ([challenge]) dice to the roll
- Boons and drawbacks rolled on attacks against vehicles, and attacks from vehicle-mounted weapons, affect the damage of the attack on a hit
- Reducing the character in control of the vehicle to 0 luck causes the vehicle to gain (or worsen by 1 step) the **Damaged** condition each time the driver/pilot is hit with a physical attack, instead of that driver/pilot gaining wounds
- When a vehicle in motion has the **Damaged x4** condition and the driver/pilot takes another hit, the vehicle is broken, and all occupants take damage from a physical area attack with a 100% chance of success

Vehicles can have the general gear keywords, though some keywords can't be applied to vehicles. If the Administrator decides a keyword doesn't fit a vehicle, replace it with another.`;

  const vehicles = [
    { name: "Chopper", size: "Small ground vehicle",
      blurb: "Loud, obvious, and powerful motorcycles, favored by those who like to make sure their presence is known. Faster and more nimble than a street car, but meant for cruising, not racing.",
      text: `**Occupants:** 1 driver (default: antagonist, 50 luck), 1 passenger

**Rumbling Engines:** Add 2 advantage dice ([advantage][advantage]) to rolls made to Goad Someone or Intimidate Someone when operating this vehicle, and 2 challenge dice ([challenge][challenge]) to rolls to Sneak Around using this vehicle.

**Hold on Tight:** When the passenger of this vehicle is reduced to 0 luck, they are knocked off the vehicle.

**Open-Air Vehicle:** The occupants of this vehicle can make attacks with their personal weapons.` },
    { name: "Street Bike", size: "Small ground vehicle",
      blurb: "Favored by street gangs, reckless teenagers, and racing enthusiasts: high-end motorcycles modified to suit the owner and to show off to their friends.",
      text: `**Occupants:** 1 driver (default: antagonist, 50 luck), 1 passenger

**Catch Me if You Can:** Add 2 advantage dice ([advantage][advantage]) to rolls made to Drive or Pilot Something when operating this vehicle when attempting to escape from pursuit.

**Hold on Tight:** When the passenger of this vehicle is reduced to 0 luck, they are knocked off the vehicle.

**Open-Air Vehicle:** The occupants of this vehicle can make attacks with their personal weapons.` },
    { name: "Commuter Car", size: "Small ground vehicle",
      blurb: "Small cars, very popular among citizens who commute from the suburbs districts to other districts for work.",
      text: "**Occupants:** 1 driver (default: single minion, 0 luck), 1 passenger" },
    { name: "Muscle Car", size: "Medium ground vehicle",
      blurb: "A beast of a car with a souped-up internal combustion engine. A throwback to the last millennium, but they just don't build 'em like they used to.",
      text: `**Occupants:** 1 driver (default: antagonist, 50 luck), 3 passengers

**Greased Lightning:** This vehicle always has the **Fast as Hell** positive condition.

**Open-Air Vehicle:** The occupants of this vehicle can make attacks with their personal weapons.` },
    { name: "Drift Car", size: "Medium ground vehicle",
      blurb: "Lightweight and agile, built for racing through the winding streets of the city with as much style as substance; usually heavily modified from stock street cars.",
      text: `**Occupants:** 1 driver (default: antagonist, 50 luck), 1 passenger

**Catch Me if You Can:** Add 2 advantage dice ([advantage][advantage]) to rolls made to Drive or Pilot Something when operating this vehicle when attempting to escape from pursuit.

**Paper Tiger:** When this vehicle suffers a Wound, it suffers 1 additional Wound.` },
    { name: "Hovercar", size: "Medium flying vehicle",
      blurb: "Commuter vehicles for those wealthy enough to afford them, kept airborne by reduced-bleed, noise-reduced turbines.",
      text: "**Occupants:** 1 driver (default: single minion, 0 luck), 3 passengers" },
    { name: "Armored Limousine", size: "Medium ground vehicle",
      blurb: "Protects VIPs traveling around the city, particularly those who lack faith in the safety of hovercars.",
      text: `**Occupants:** 1 driver (default: antagonist, 50 luck), 8 passengers

**Ablative Armor Plating:** When this vehicle would gain or worsen the Damaged condition from an attack, roll percentile dice with a 50% chance of success; on a success, the vehicle does not take a wound.` },
    { name: "Street Tank", size: "Medium ground vehicle",
      blurb: "Armored vehicles about the size of a delivery truck, used by police and military contractors for urban combat. Wheels on segmented legs give them a spider-like look and let them fit down twisting alleys.",
      text: `**Occupants:** 1 pilot (default: minor villain, 100 luck)

**Armored:** This vehicle has the **Armored x2** condition.

**Forward Chain Gun** (Automatic, Mounted): 65%, 40 physical damage

**Rocket-Propelled Grenades** (Explosive, Long Range, Mounted, Slow): 75%, 45 physical damage` },
    { name: "Police Mecha", size: "Large ground vehicle",
      blurb: "Humanoid walking suits of armor towering dozens of feet above the street, ready to put down riots or fight kaiju. Most are piloted with total sensory interruption.",
      text: `**Occupants:** 1 pilot (default: minor villain, 100 luck)

**Jump Jets:** This vehicle can travel long distances while flying, covering a distance equivalent to a fighter jet. During conflict scenes, however, this vehicle can only fight from the ground.

**Arm Cannon** (Laser, Mounted): 65%, 65 physical damage

**Shoulder-Mounted Missile Rack** (Explosive, Long Range, Mounted, Slow): 75%, 45 physical damage` },
    { name: "Attack Helicopter", size: "Large flying vehicle",
      blurb: "Used by private security forces, government military units, and corporations who take executive privilege with deadly seriousness.",
      text: `**Occupants:** 1 pilot (default: minor villain, 100 luck), 3 gunners, 6 passengers

**Turret-Mounted Chain Guns (x2)** (Automatic, Mounted): 65%, 40 physical damage

**Air to Air Missiles** (Explosive, Long Range, Mounted, Slow): 75%, 45 physical damage` },
    // The book lists the shuttle and the dropship as small ground vehicles; kept as printed.
    { name: "Cargo Shuttle", size: "Small ground vehicle",
      blurb: "Hoverjet-enabled shuttles for valuable cargo, out of reach from the ground: the airborne armored car, with chaff deployers and interceptor rockets.",
      text: `**Occupants:** 1 driver (default: antagonist, 50 luck), 1 passenger

**Air Defense Countermeasures:** This vehicle has the **Protected Against Anti-Aircraft Weapons x4** condition.` },
    { name: "Tactical Dropship", size: "Small ground vehicle",
      blurb: "Sleek, armored, black-hulled, and whisper-quiet, carrying squads of elite soldiers and private security for rapid deployment in any district.",
      text: `**Occupants:** 1 driver (default: minor villain, 100 luck), 12 passengers

**Antipersonnel Cannon** (Armor-Piercing, Mounted): 65%, 40 physical damage

**Shock and Awe:** When the Administrator spends heat to add a squad of minions to a scene, they may spend 2 additional heat [heat][heat] to also add this vehicle with its default pilot to the scene as the means by which the squad arrives.` },
  ];

  const keywordsIntro = "Keywords are short, descriptive tags that add mechanics beyond an item's base functionality. Weapons can have gear keywords too, but weapon keywords are only for weapons.";

  const keywords = {
    positive: [
      { name: "Compact", text: "A compact piece of gear has miniaturized components and eliminates empty space to make it smaller than expected. Add 1 advantage die ([advantage]) to any roll made to conceal a compact piece of gear." },
      { name: "Cybernetic", notOn: ["weapon", "vehicle"], excludes: ["Archaic", "Bulky"], text: `A cybernetic piece of gear is meant to be integrated directly into the body of the owner just like other cybernetic augmentations. It draws power from the owner's body and is controlled by their nanite swarm. The item does not function until it has been installed into its owner and integrated into their ecosystem of other augmentations, which can be done by spending a montage action to have the installation performed.

Weapons cannot have the Cybernetic keyword (instead, take the **Weapon Mount** cybernetic augmentation), an item cannot have the Cybernetic keyword if it also has the Archaic or Bulky keywords, and vehicles cannot have the Cybernetic keyword.

The Administrator has final say as to whether a piece of gear can have the Cybernetic keyword. When a crew member has a piece of cybernetic gear installed, their player works with the Administrator to decide where on the body it is installed, and what (if any) limitations or additional intrinsic conditions the item might have.` },
      { name: "Durable", text: "This item is made of sturdy materials and displays craftsmanship that speaks to its longevity. The first time this item would gain the **Damaged** negative condition in a scene, it does not gain that condition." },
      { name: "Easily Nanoprinted", excludes: ["Complicated"], text: "This item has a relatively simple construction using common materials, allowing it to be rapidly assembled and disassembled by a nanoprinting cloud. At the end of a scene you are in, you can have the item broken down into raw materials by a nanoprinting cloud. This keyword is required for objects assembled by the Nanoprinting cybernetic augmentation. An item cannot have both the Easily Nanoprinted and Complicated keywords." },
      { name: "Mastercraft", excludes: ["Cheap", "Jury-Rigged", "Knockoff"], text: "The item bears the mark of a master craftsperson. The item has the **Crafted by a Renowned Maker x2** positive condition, which applies only to mental skill rolls when the Administrator agrees that the reputation of its maker (and someone else's ability to recognize the maker's mark) would influence the outcome you are hoping to achieve. This keyword cannot be on an item that also has the Cheap, Jury-Rigged, or Knockoff keywords." },
      { name: "Reliable", excludes: ["Unreliable"], text: "The item can be trusted to fulfill its purpose, even under less than ideal conditions. Whenever you would roll any number of challenge dice ([challenge]) while using this item, also add 1 advantage die ([advantage]) to the roll. This keyword cannot be on an item that also has the Unreliable keyword." },
      { name: "Secured", text: "The item has some kind of biometric lock on it (fingerprint pad, retinal scanner, etc.) that makes it so that it can only be used by an authorized shell." },
      { name: "Standardized", text: "The item is made of readily available and modular parts, making it easy to repair, modify, and upgrade. Any time you would make a roll to **Fix or Modify Something** while working on this item, you succeed no matter what you roll on the percentile dice." },
      { name: "Stealthy", text: "The item has built-in sensor baffling technology that shields it from electronic surveillance. The item cannot be detected by any electronic sensors, save for those built into Military-grade security systems." },
      { name: "Stylish", text: "The item is aesthetically pleasing or fashionable in its appearance. When not concealed, the item has the **Fashionable** positive condition." },
      { name: "Subtle", text: "The item has elements to disguise its true purpose, and it draws less attention even when used. When you would generate any heat [heat] due to taking an action using the item, reduce the amount of heat generated by 1." },
      { name: "Versatile", text: "The item has uses and capabilities beyond what is normally expected of it. Whenever you roll any number of boons ([boon]) on a roll while using this piece of gear, immediately roll 1 extra advantage die ([advantage]) and add it to the roll." },
      { name: "Wearable", notOn: ["vehicle"], text: "The item is meant to be worn on the arm, wrist, neck, head, leg, or other accessible body part. This keyword can only be present on items that are not, by default, meant to be worn (such as clothing or bags), and vehicles cannot have this keyword." },
    ],
    negative: [
      { name: "Archaic", text: "The item is old, from a time when technology was far less advanced, and does not interact with modern computers. The item cannot be used as a part of any action to interact with a computerized system, and you cannot gain the benefits of any cybernetic or synthetic augmentations on rolls made while using the item." },
      { name: "Bulky", notOn: ["vehicle"], excludes: ["Compact"], text: "The item is large, cumbersome, awkwardly-shaped, or otherwise difficult to carry and manipulate due to its size. It requires two hands to carry or must be transported in a vehicle and imposes the **Bulky** negative condition on any roll made to move the item quickly or deftly. An item cannot have both the Bulky and Compact keywords, and vehicles cannot have this keyword." },
      { name: "Cheap", text: "The item is made from cheap parts in a hasty way and is prone to damage. When this item gains or worsens the **Damaged** condition, worsen the condition by one additional step." },
      { name: "Complicated", text: "The item is not very user-friendly, and its construction is bafflingly complex. This object has the **Hard to Work On x2** intrinsic negative condition, which applies to any roll to repair, upgrade, or otherwise alter the object." },
      { name: "Expensive", text: "Whenever you would acquire an item with this keyword, you must roll to **Throw Money at the Problem** (in addition to any other rolls you are required to make to acquire it during a scene). If you fail the roll, you fail to acquire it. If this keyword is on a piece of starting gear, at the end of each job you must succeed on a roll to Throw Money at the Problem or lose it as a piece of starting gear." },
      { name: "Flashy", text: "The item is visually distinctive and difficult to ignore, eliciting curiosity, excitement, or fear from bystanders. Add 1 heat [heat] to the heat pool after any scene in which this item was actively used." },
      { name: "Fragile", notOn: ["vehicle"], text: "The item has delicate parts that sometimes break when it is not handled with care. When you take damage as a result of failing a roll to accomplish something dangerous, this object automatically breaks. Vehicles cannot have this keyword." },
      { name: "Jury-Rigged", text: "This item was assembled quickly from spare parts by an individual instead of being mass-produced. At the end of any scene in which the item is used, the item becomes broken." },
      { name: "Knockoff", text: "The item seems like a model from a major manufacturer but is actually a cheaply-produced facsimile. This item has the **Not Quite Right** intrinsic negative condition." },
      { name: "Loud", text: "The item produces noise at a volume that is impossible to ignore. When this piece of gear is used, it emits a noise that can be heard by anyone up close or near to it." },
      { name: "Rare", text: "Whenever you would acquire an item with this keyword, you must spend 1 influence [influence] to obtain it; otherwise, you fail to acquire it. If this keyword is on a piece of starting gear, at the end of each job you must spend 1 influence [influence] to retain it or lose it as a piece of starting gear." },
      { name: "Unpredictable", text: "Whenever you roll any number of drawbacks ([drawback]) on a roll while using this piece of gear, immediately roll 1 extra challenge die ([challenge]) and add it to the roll." },
      { name: "Unreliable", text: "The item has some design or manufacturing flaw that causes it to malfunction at inopportune times. You cannot push your luck on a roll where you used a piece of gear that has this keyword." },
    ],
    weapon: [
      { name: "Activated", text: "Weapons with this keyword do not attack their targets until remotely triggered by the person controlling it. Activating a weapon does not use your action in a conflict scene, but putting the weapon in place does." },
      { name: "Armor-Piercing", text: "Exceptionally good at penetrating the hard plating on the outside of vehicles and robots, adding 1 advantage die ([advantage]) on all rolls for physical attacks made against automatons and vehicles." },
      { name: "Automatic", text: "Automatic weapons fire rapidly for as long as the wielder holds down the trigger and has ammo. This makes them particularly effective against squads of minions, adding 1 advantage die ([advantage]) on physical attacks made against minions using this weapon." },
      { name: "Close Range", text: "Weapons with this keyword are meant to be used at short range, and add 1 challenge die ([challenge]) to any attack rolls made against targets that are far away from the wielder." },
      { name: "Compact", text: "A compact weapon is either small and easily concealed on its own, or breaks down into smaller parts that can be hidden and then reassembled quickly, often at the push of a button. Add 1 advantage die ([advantage]) to any roll made to conceal a compact weapon." },
      { name: "Concussive", text: "A concussive weapon unleashes a burst of kinetic force on impact. On a hit with a physical attack, this weapon pushes the target away from the point of impact by one step of distance (from up close to near, or from near to far)." },
      { name: "Debilitating", text: "These weapons emit chemicals, poisons, or other toxic elements that cause extreme pain and other debilitating biological conditions. Human characters gain the **Debilitated** condition when hit by this weapon." },
      { name: "Electromagnetic", text: "Short bursts of electromagnetic energy that cannot kill a living being but can easily short out a person's built-in electronics. Vehicles, drones, synthetic characters, and characters with any cybernetic body augmentations gain the **Overloaded** condition when hit by this weapon." },
      { name: "Explosive", text: "This weapon (or the projectiles it fires) detonates on impact or on a short delay. When this happens, the weapon or projectile is destroyed. Attacks with this weapon are always area attacks." },
      { name: "Flechette", text: "Fires a small cloud of tiny, ultrasharp darts or pieces of shrapnel which can be devastating at close range where the spread is tightest. Add 1 advantage die ([advantage]) on all rolls made for attacks using the weapon against targets that are up close to the wielder." },
      { name: "Fusion", text: "A fusion weapon has a power core that charges up before releasing a burst of concentrated radioactive energy. Before attacking with the weapon, the wielder may spend an action to prime it, and it holds this charge until the attack is made with an additional **+30** to the weapon's damage bonus." },
      { name: "Jagged", damage: 5, text: "A jagged weapon has particularly sharp or serrated edges that make even close calls potentially painful. Jagged weapons have an additional **+5** bonus to damage." },
      { name: "Laser", text: "Laser weapons use concentrated beams of light to deal damage to the target. If you roll lower than a 20 when attacking with this weapon, treat the attack as though you had rolled a 20." },
      { name: "Long Range", text: "Weapons with this keyword are meant to be used at long range, and add 1 challenge die ([challenge]) to any attack rolls made against targets that are up close to the wielder. Weapons with this keyword do not add any challenge dice to attacks due to the target being far away from the wielder." },
      { name: "Miniaturized", damage: -10, hands: 1, text: "A miniaturized weapon is smaller than its normal versions. Miniaturized weapons are treated as one-handed weapons and reduce the weapon's damage bonus by **−10**." },
      { name: "Mounted", damage: 10, text: "A mounted weapon is fixed in place, attached to a drone, object, vehicle, or even a character. Mounting or unmounting a weapon requires the use of an action in a conflict scene. Mounted weapons can be bulkier because they are stabilized by the thing they are mounted to, increasing the damage of the weapon by **+10**. One-handed weapons can be mounted on a character through cybernetic enhancement." },
      { name: "Nonlethal", text: "Specifically designed to incapacitate without killing. Ranged weapons fire blunted rubber bullets or beanbags, and melee weapons have padding to reduce the degree of injury they inflict. A nonlethal weapon cannot inflict wounds beyond those that would render the target unconscious." },
      { name: "Obfuscating", requires: ["Explosive"], text: "The weapon deals no damage but creates a radius of smoke, artificial darkness, or some other visual blocker that makes that area opaque. That area imposes the **Obfuscated x4** negative condition on anyone attempting to see into the area from the outside, or anyone inside the area attempting to see out. Only weapons with the Explosive keyword can have the Obfuscating keyword." },
      { name: "Phasing", text: "The weapon (or its projectiles) is a mesh of nanomachines that can temporarily shift their position in order to phase through solid objects. Do not add challenge dice to attack rolls with a phasing weapon due to the target being behind cover (though any challenge dice added for the target being concealed from view may still apply)." },
      { name: "Plasma", text: "Plasma weapons compress superheated gas to produce volatile energy that travels at incredible speed. When a plasma weapon damages an enemy with 0 luck, that enemy takes 1 extra wound from the attack." },
      { name: "Proximity", text: "Weapons with this keyword do not attack their targets until a character, drone, vehicle, or animal is up close to it." },
      { name: "Rail", text: "Rail weapons use a line of electromagnetic generators to propel a projectile at incredible speeds, causing the bullet to travel farther and with greater accuracy. Add 1 advantage die ([advantage]) on all rolls made for attacks using the weapon against targets that are far away from the wielder." },
      { name: "Shock", text: "A weapon with this keyword issues a charge of electricity in lieu of relying on kinetic impact to deal damage. Hitting a target with 0 luck using a shock weapon immediately renders the target unconscious or deactivated (but does not apply the wounded condition). On subsequent turns, if the target succeeds on a **Tough it Out** check at the start of the round, they are no longer unconscious or deactivated." },
      { name: "Silent", excludes: ["Concussive"], text: "Weapons with this keyword make little to no noise when used, and can be used to make attacks that benefit from archetype perks that require the attacker to make no noise. The silent keyword cannot be on the same weapon as the concussive keyword." },
      { name: "Slow", text: "Weapons with this keyword require reloading or priming between attacks, consuming an action to ready the weapon for its next attack." },
      { name: "Stationary", text: "Stationary weapons must be attached to the ground, walls, or other solid, immobile objects before they can be used to make an attack." },
    ],
  };

  // The Skills tab, from the rulebook's Skills section: mental and physical skills, then Anything Else.
  const skills = [
    {
      title: "Mental skills",
      intro: "Skills are divided into two groups—mental and physical. Names of mental skills appear on the left side of the skills section of the character sheet. These skills, which reflect a character's intellect and education are described in detail below.",
      entries: [
        { name: "Analyze Data", text: "A character uses this skill when they need to acquire knowledge by looking for information or at information in search of actionable clues or meaningful conclusions. A character might use this skill as they pore over blueprints looking for a safe access point, while they dig into the digital histories of individuals in a mark's entourage to find someone vulnerable to leverage, or when they sift through captured transmissions to uncover an executive's personal password." },
        { name: "Case the Joint", text: "A character uses this skill when they need to explore a location or locate an object. This skill can cover passive observation or active searching, usually providing the character with information about a specific location or Network node. A character might use this skill to determine the level of security at a checkpoint, to find a good place to hide in the lobby of a building, or to pinpoint locations of security cameras in an executive penthouse." },
        { name: "Convince Someone", text: "A character uses this skill primarily in social situations, when they need to persuade someone to think or behave differently. A character might use this skill to convince a citizen to open a locked door, to encourage a disgruntled corporate employee to reveal secret information, or to urge a black-market arms dealer to sell an item from their private stock." },
        { name: "Cover Your Tracks", text: "A character uses this skill when they want to ensure that no evidence is left behind after a clandestine action by themselves or by a fellow crew member. This skill can be used to hide evidence of either physical or digital deeds, and it can be used preemptively to disguise the crew's actions. Cover Your Tracks is comparable to the Lie to Someone skill, but it applies more to physical interaction with objects, locations, and digital systems instead of through social interactions with others. A character might use this skill to erase the logs of a Network node they just hacked, to create a forged ID badge or disguise, or to clean up the evidence of a fight between their crew and a security team." },
        { name: "Crash a System", text: "A character uses this skill when they want to shut down part or all of a computer system with no regard for subtlety—the digital equivalent of punching someone in the face. A character uses this skill to make digital attacks, both in the physical world and in the Network, and it is often the fastest way to take out the opposition's computers. A character might use this skill to shut down the scanners at a security checkpoint, to destroy automaton programs guarding a Network node, or to crash software that controls the cybernetic eye implants of a target, temporarily blinding them." },
        { name: "Distract Someone", text: "A character uses this skill when they want to draw someone's attention away from something—often to enable themselves or a fellow crew member to take an action without being noticed. Applying in the Network as well as in the physical world, this skill might be used to draw a guard's attention as an ally sneaks past, to hold an executive's attention while a comrade lifts their security badge, or to prevent a system administrator from noticing the penetration of a node's encryption systems." },
        { name: "Fix or Modify Something", text: "A character uses this skill when they need to make technical or mechanical repairs, changes, or upgrades. Applying to mechanical systems, computer hardware, and digital software, this skill might be used by a hacker to alter a program, changing its functions or concealing a virus. A character might use this skill to install a new mounted weapon on a vehicle, to repair a crew member's damaged cybernetics, or to modify facial recognition software to return falsified data." },
        { name: "Goad Someone", text: "A character uses this skill when they want to manipulate or provoke someone emotionally rather than rationally. Whether by stoking anger, resentment, recklessness, or lust, a character might use this skill to overwhelm another person's self-control, leading them to behave impulsively. A character might use this skill to antagonize someone to throw a punch, to convince an executive to bet recklessly in a gambling hall, or to convince a guard to abandon their post for a momentary romantic tryst." },
        { name: "Gossip with [Citizens/Corporates/Criminals]", text: "A character uses one of the three \"Gossip with...\" skills when they want to get information from someone or to casually socialize or gain favor with someone. Each of these skills is useful with a different group of people: Gossip with Criminals when dealing with the Right Kind of People, Gossip with Corporates when dealing with executives, functionaries, agents, and collaborators, and Gossip with Citizens when dealing with anyone else. A character might use these skills to eavesdrop on a conversation between two private security guards, to become a familiar face at a private club frequented by executives, or to spread an effectively devastating rumor among the Right Kind of People." },
        { name: "Heal Someone", text: "A character uses this skill when they apply medical care to someone or when they interact with pharmaceuticals and other medical technology. This skill also applies when repairing or tinkering with artificial bodies used by synthetic intelligences, as the systems that help them blend seamlessly with the human population are sufficiently comparable with human biology. A character might use this skill to apply first aid to a wounded crew member, to administer an antidote to a poison, or to bypass damaged cybernetics to prevent a patient from suffering jolts of pain." },
        { name: "Infiltrate a System", text: "A character uses this skill when they want to get into a computer system without being noticed. The most subtle of the digital skills, Infiltrate a System is the electronic equivalent of sneaking around or picking someone's pocket. A character might use this skill to snoop around in an executive's private communications, to slip past a security automaton guarding a Network node, or to tap into the camera feed from a building's security network." },
        { name: "Intimidate Someone", text: "A character uses this skill when they want to coerce someone through threat of violence or other harm. Intimidate Someone can be used to threaten someone with physical injury or to plant a seed of fear in their mind, suggesting dire consequences for them or for their loved ones, if they don't do as you say. A character might threaten to smash up a bar to coerce the bartender into giving up information on a patron, or a character might subtly imply that they will release blackmail material regarding a certain executive unless the executive acquiesces to the character's demands." },
        { name: "Lie to Someone", text: "A character uses this skill when they want to deceive someone in direct social interactions, both verbal and nonverbal. This skill enables a character to convince someone else to believe something that isn't true. A character might use this skill to convince a personal assistant that they have an appointment with a corporate executive, to convince a Network node admin that they simply forgot their password, or to lie about their identity when meeting a mark for the first time." },
        { name: "Override a System", text: "A character uses this skill when they want to force a computer system to do something that it wouldn't otherwise do. Successful use of Override a System allows a character to seize control of a computer or piece of software, retaining functionality but under the character's direction. A character might use this skill to cause a police drone to crash into another vehicle, to activate an alarm when a specific corporate collaborator walks through a biometric scanner, or to redirect automated security guns to fire on the people they were designed to protect." },
        { name: "Play a Game", text: "A character uses this skill when they play any type of game, including games of chance, games of skill, sports, and gambling, even video games, slot machines, card games, or the races and gladiatorial games popular in the Network. A character might use this skill to fleece a mark at the poker table, to ingratiate themself to an executive by skillfully challenging them in a game of tennis, or to throw an e-sport match without making it look intentional." },
        { name: "Read the Situation", text: "A character uses this skill any time they want to understand what's really happening in a given location. This is a good catch-all skill when a character can apply first-hand observation to people, places or events. The character correlates multiple clues or data points, enabling them to see the bigger picture. A character might use this skill to figure out who the undercover casino workers are, to study a security detail's reaction protocols during a crisis, or to identify big-fish executives at a swanky party." },
        { name: "Size Someone Up", text: "A character uses this skill when they need to get information about an individual, typically someone they are observing first-hand. Size Someone Up can be used to learn information about someone's capabilities, disposition, truthfulness, or physical state, as well as clarifying their motives and predilections. A character might use this skill to determine whether they can take someone in a fight, to figure out if someone is lying to them, or to identify an avenue of persuasion that someone would be particularly susceptible to." },
        { name: "Throw Money at the Problem", text: "A character uses this skill when they need to rely upon money or other material goods to make something happen. The \"money\" in the skill name might take the form of contraband goods, rare and valuable objects, or entertainment, food, or services that the target might otherwise be unable to procure. A character might use this skill to bribe a guard into letting them through a checkpoint, to acquire an illegal piece of software in exchange for a bottle of rare scotch, or to treat a system administrator to have an extravagant night on the town while fellow crew members hit the Network node the administrator is charged with protecting." },
      ],
    },
    {
      title: "Physical skills",
      intro: "Names of physical skills are listed on the right side of the bottom portion of the skills section of the character sheet. These skills represent a character's strength, dexterity, and training—or that of the shell the character has loaded into.",
      entries: [
        { name: "Break or Destroy Something", text: "A character uses this skill to damage a physical object, either using their own strength, specialized tools, or even explosives. A character might use this skill to smash an enemy's weapon and disable it, to blast down a wall with explosives, or to use a cutter to slice through the locking mechanism of a safe." },
        { name: "Climb, Jump, or Tumble", text: "A character uses this skill when they need to overcome physical obstacles, to avoid dangers, to move their body over or past an object, to ascend, to descend, to accomplish a complex physical maneuver. A character might use this skill to scale a building, to avoid laser tripwires, or to leap from one rooftop to the next." },
        { name: "Conceal an Object", text: "A character uses this skill when they want to physically hide an item, perhaps to simply conceal something on their person or to cleverly camouflage a large object. A character might use this skill to pass through a security checkpoint while carrying a sniper rifle hidden in a sensor-baffling case, to stow a cache of weapons for use during a heist, or to plant a tracking device on a corporate collaborator as they make their way to the office." },
        { name: "Drive or Pilot Something", text: "A character uses this skill when they operate a vehicle or control a drone. Whether they are physically occupying the machine or controlling it remotely, a character might use this skill to drive a hovercraft in a daring escape, to navigate a drone through a building ventilation system, or to weave through traffic on a sporty motorcycle." },
        { name: "Lift or Move Something", text: "A character uses this skill when they want to physically move something, typically something heavy or awkwardly large. A character might use this skill to lift a large crate, to shove a heavy object off a balcony, or to drag a fallen comrade out of the line of fire." },
        { name: "Run Like Hell", text: "A character uses this skill when they want to move fast, getting away from (or closer to) something with haste. This skill comes into play when the most essential factor is speed, not skirting obstacles. A character might use this skill to flee from pursuing security guards, to close the distance between themself and a distant target, or quickly run along an office hallway before making an escape out a window." },
        { name: "Shoot Someone", text: "A character uses this skill when they use a ranged weapon that fires a projectile. The skill applies to firearms, to archaic weapons, such as a crossbow, and the skill applies to weapons mounted on vehicles or turrets. Shoot Someone is most frequently used to make physical ranged attacks, but the skill might be checked in other circumstances, such as firing a grappling hook at the correct ledge." },
        { name: "Slash, Stab, or Strike Someone", text: "A character uses this skill to hit someone or something, whether unarmed, wielding a melee weapon, or brandishing an improvised weapon. Slash, Stab, or Strike Someone is almost always used to make melee attacks." },
        { name: "Sneak Around", text: "A character uses this skill when they attempt to stealthily avoid detection. A character might use this skill to sneak past a patrol of security guards, to avoid the line of sight of an array of rotating security cameras, or to quietly crawl through a building's ventilation ducts." },
        { name: "Throw Something", text: "A character uses this skill when they attempt to hurl a physical object through the air, perhaps attacking with a thrown weapon or simply tossing an item accurately. A character might use this skill to lob a grenade over a barricade, to throw a shuriken at a security robot, or to carefully toss a stolen object out an open window to a waiting crew member below." },
        { name: "Tough it Out", text: "A character uses this skill when they need to overcome pain, exhaustion, or wounds. Tough it Out comes into play when toughness, endurance, or health are key to succeeding at an action. A character might use this skill to hold an automatic door open so their crew can sneak through, to absorb an impact while cradling a delicate object during a fall, or to overcome the debilitating effects of a cloud of tear gas." },
      ],
    },
    {
      title: "Anything else",
      intro: "When a character needs to make a check and the Administrator determines that the best skill for the roll is one for which the character does not have any improved chance of success, the character will instead check Anything Else. A character always has at least a 50% chance of success with Anything Else.",
      entries: [],
    },
  ];

  root.NCD_DATABANK = { gear, armor, toolSets, weapons, weaponsIntro, vehicleRules, vehicles, keywordsIntro, keywords, skills };
})(globalThis);
