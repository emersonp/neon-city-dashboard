// The GM Screen tab's tables, from the rulebook: what the Administrator rolls on or looks up during a session.
// No page code here, so it can be tested in Node. Text uses the format.js description format, like databank.js.
//
// randomKeywords  the random gear keywords table: [range, positive, negative]
// securityTiers   the security system tiers: { name, text, defenses: [names, as the table shows them] }
// alarmHeat       the heat an obstacle's alarm adds to the heat pool, by security tier: [tier, heat], and alarmHeatIntro
// securityDefenses the security systems the tiers' defenses name: { name, tag?, text }. A defense in a tier links to the
//                 one here of the same name (any case); X-ray scanners are described but in no tier.
// liabilities     the liability table: [range, liability]. A character picks (or rolls) one at their first End Session
//                 or Finish Job.
// distinctiveTraits the distinctive visual traits table: [range, trait]. Create's physical appearance can take one, and a
//                 successful job's distinctive feature reward adds one to it.
// objectives      the rulebook's sample objectives: [{ title, intro, entries: [{ name, tag?, text }] }]
// obstacles       the basics of obstacles, example obstacles, and the physical and Network security systems as
//                 objectives, in the same shape
// complications   the complications the Administrator spends heat on, in the rulebook's three groups (minor, major,
//                 plot twists): { title, intro, entries: [{ name, tag?, text }] }; the title's [heat] is the icon
// headlines       the headline news tables, in the order they're rolled: { title, question, head, rows: [range, text] }.
//                 A row naming Table X-1 rolls on it again (headlineNews).
// headlineNews(rng) rolls each headline news table in order: [{ question, text }], text being the roll and its row
//                 ("16: C04: The Digital Security Firm"). Where a row says to roll on Table X-1, it does: "07, then 59: C15: The
//                 Software Firm", like the rulebook's example. Needs dice.js.
(function (root) {
  const randomKeywordsIntro = "When the crew acquires a piece of gear during a session, you can give it a positive and a negative keyword and describe what makes the item different: roll twice on this table (once for each), or just pick two that make sense. Re-roll a keyword that doesn't make sense for the item or the situation.";
  const randomKeywords = [
    ["01-10", "Compact", "Bulky"],
    ["11-20", "Durable", "Cheap"],
    ["21-30", "Reliable", "Complicated"],
    ["31-40", "Secured", "Flashy"],
    ["41-50", "Standardized", "Fragile"],
    ["51-60", "Stylish", "Knockoff"],
    ["61-70", "Wearable", "Loud"],
    ["71-75", "Cybernetic", "Archaic"],
    ["76-80", "Easily Nanoprinted", "Expensive"],
    ["81-85", "Mastercraft", "Jury-Rigged"],
    ["86-90", "Stealthy", "Rare"],
    ["91-95", "Subtle", "Unpredictable"],
    ["96-100", "Versatile", "Unreliable"],
  ];

  const securityTiers = [
    { name: "Unprotected", defenses: [], text: "No meaningful security measures to speak of. Citizens’ apartments and public spaces rarely have meaningful security beyond locked doors." },
    { name: "Monitored", defenses: ["Security cameras (audio/2D video feeds)"], text: "The only security here is passive video recording. Sometimes there are security guards watching a live feed from the cameras, but more often they are simply recording video to be used as evidence later if they catch something illegal." },
    { name: "Consumer-Grade", defenses: ["Motion sensors", "Coded keypad", "Badge readers"], text: "Security systems that are available to the general public, and often found in places where the security is there to deter law-abiding citizens from messing with things they shouldn’t. Shopping centers, office buildings, the apartments of corporate collaborators, and the few remaining small businesses usually have security of this tier." },
    { name: "Government-Grade", defenses: ["Retinal scanners", "Hive RFID readers", "Fingerprint readers"], text: "More advanced technology that usually requires permits or exclusive contracts to obtain, though chronic under-funding usually means security of this tier isn’t exceptionally difficult to overcome if you know what you’re doing. Government buildings, police motor pools, and the homes of public figures usually have security of this tier, and some sites owned by corporations (those containing valuable items, but not trade secrets) when the company makes budget cuts." },
    { name: "Corporate-Grade", defenses: ["Biometric sensors", "Laser tripwires", "Pressure sensors"], text: "Real money is being spent on security of this tier, which is used to guard corporate secrets and high-value assets. Corporate headquarters, private security guard dispatch offices, R&D laboratories, high-tech manufactories, and some of the homes of more junior executives usually have security of this tier." },
    { name: "Military-Grade", defenses: ["Tremor detectors", "Thermal sensors", "Ultrasonic receptors"], text: "A combination of cutting-edge technology and paranoia is the hallmark of this security tier, which is usually found in locations where dark secrets, weapons of mass destruction, or priceless items are kept. Military outposts, secret research facilities, and the homes of senior executives have security of this tier." },
  ];
  const alarmHeatIntro = "If players ignore obstacles, you can add [challenge][challenge] to rolls to accomplish the scene's main goal. If appropriate, add [heat][heat] instead. Obstacles that involve witnesses or obstacles that can raise alarms have more immediate repercussions.";
  const alarmHeat = [
    ["Monitored", 1],
    ["Consumer-Grade", 2],
    ["Government-Grade", 4],
    ["Corporate-Grade", 6],
    ["Military-Grade", 10],
  ];
  const securityDefenses = [
    { name: "Biometric Sensors", text: "While “biometric” sensors technically encompasses both fingerprint and retinal scanners, this objective represents advanced biometric sensors that use a combination of infrared and x-rays to identify a person based on their musculature, unique skeletal markers, and other indicators that lie beneath the skin. These sensors are sometimes preferred over fingerprint or retinal scanners because they do not require the subject to actively participate in the scanning process, which can be done secretly by cleverly-hidden sensors." },
    { name: "Fingerprint Readers", text: "Similar in both function and drawbacks to retinal scanners, fingerprint readers require the person attempting to pass to place one or more fingers on a tactile reader, which then identifies the person passing through based on their unique fingerprints. Fingerprints are almost impossible to replicate, resulting in at least a confident identification of the shell." },
    { name: "Hive RFID Readers", text: "Some security checkpoints require that the person scan their hive to verify their identity, an upgraded version of a modern-day badge reader. This objective is more difficult to bypass because it also requires the person scanning their hive to confirm that they voluntarily swiped it with a message direct to their internal HUD." },
    { name: "Laser Tripwires", tag: "Objective · Difficulty 50", text: "Tripwire sensors detect when a beam of light is broken by something physically passing through it. Though rudimentary, they are relatively cheap to install, and the lasers can be either invisible or made visible in order to deter intruders." },
    { name: "Motion Sensors", text: "Motion detectors often use microwave sensors or passive infrared sensors that make them difficult to simply move past sneakily, as there are fewer (if any) blind spots. They usually require hacking or some other form of direct interference with the sensor itself." },
    { name: "Pressure Sensors", tag: "Objective · Difficulty 50", text: "Pressure sensors are built into the floor and detect when a person steps on them. They can be overcome by finding ways to move through a space without stepping on the floor, or by finding a way to intercept the signal it sends to sound the alarm." },
    { name: "Retinal Scanners", text: "Retinal scanners read the unique patterns within the retinas of the human (or synthetic) eye, which act as an identifier at least of the body that is attempting verification. While it does not guarantee the true identity of the person within the body, given how infrequently most citizens load into a shell other than their default body it is usually seen as reliable verification for all but the most secure facilities." },
    { name: "Tremor Detectors", text: "These sensors can detect even the subtlest of vibrations, sounding an alarm at any noise louder than a whisper. They are usually only employed in places like art galleries or private offices when no one is expected to be around, and can be bypassed by finding ways to baffle the sound that one makes when moving within their range." },
    { name: "Thermal Sensors", text: "Thermal sensors detect changes in the ambient temperature within a particular zone, sounding the alarm if the temperature rises too much (say, as the result of the warmth of a human body heating up the air in a room). They are typically only useful in areas that are tightly climate-controlled and unaffected by the changes in outside temperature throughout the day." },
    { name: "Ultrasonic Receptors", text: "Ultrasonic receptors detect sound waves within their protected area. Ultrasonic receptors are extremely sensitive, but also have the fidelity to discern between different pitches and frequencies, allowing them to filter out the expected noises of environmental systems or other ambient noise and sound the alarm only if an unexpected sound (such as a heartbeat, or a footstep) is detected." },
    { name: "X-Ray Scanners", text: "Like security cameras, the x-ray scanners associated with this objective are typically only used in situations where someone is actively monitoring their scans. When a person passes through an x-ray scanner, a video feed shows an unobstructed view of what would otherwise be concealed by armor, bags, or clothing, allowing the personnel monitoring it to sound an alarm if someone tries to smuggle something past them. While the AI in the software that runs these scanners can identify obvious threats like weapons, most checkpoints using these scanners still rely on sentient personnel to double-check the results." },
  ];

  const liabilities = [
    ["01-05", "You have a spouse and children that aren’t fully aware of your illegal activities"],
    ["06-10", "You have an addiction to alcohol, narcotics, synsenses, or some other vice"],
    ["11-15", "You have a secret romance with someone whose associations make it dangerous"],
    ["16-20", "Your swarm was installed when you were too young, and your mind was affected (humans) / There was a defect in your original code that became part of your consciousness when you achieved sentience (synthetics)"],
    ["21-25", "You were a corporate agent but were burned; old corp rivals are still gunning for you"],
    ["26-30", "You own a home or business that you are just barely hanging onto for some reason"],
    ["31-35", "You owe large gambling debts to bookies and loan sharks that want their money"],
    ["36-40", "You were once a police or private security officer but were forced to resign in disgrace"],
    ["41-45", "Your parents are executives, and you grew up wealthy, only to rebel and take up crime"],
    ["46-50", "You have a rival among the Right Kind of People who wants to see you out of the game"],
    ["51-55", "You are looking to get out of this life of crime but keep getting pulled back in"],
    ["56-60", "You once copied your mind into a second body, and your old duplicate is still out there"],
    ["61-65", "You are an adrenaline addict, to the point where people believe you have a death wish"],
    ["66-70", "You have a sibling, parent, or mentor who is ailing and depends on you for care"],
    ["71-75", "You are young, and this is your first life; you’re fresh-faced and naïve"],
    ["76-80", "You betrayed your old crew, and all of the Right Kind of People know about it"],
    ["81-85", "One of your old mind backups was corrupted, and you still get glitches in your memory"],
    ["86-90", "There’s a large price on your head, and bounty hunters frequently try to collect"],
    ["91-95", "After something went wrong on another job, almost all backups of your ghost were corrupted; you were restored from a years-old backup and are still piecing together what happened during the years that version of you lived"],
    ["96-100", "Your default body has a recurring physical condition as a result of a glitch in the cloning or manufacturing process that created it"],
  ];

  const distinctiveTraits = [
    ["01-03", "Glowing tattoos created by subdermal LCD injections"],
    ["04-05", "Longer fingers with an extra joint"],
    ["06-08", "Metal horns resembling a ram’s or demon’s horns"],
    ["09-10", "Flexible carbon fiber tail grafted to your lower back"],
    ["11-13", "Eyes augmented with light-reflecting irises or grafted-on mirrored shades"],
    ["14-16", "A mohawk made of metal plates or spines"],
    ["17-19", "Artificially textured skin designed to look like reptile or dragon scales"],
    ["20-22", "Fiber-optic hair implants that glow in colors you control and change"],
    ["23-25", "Blacklight-reactive permanent makeup facial tattoos"],
    ["26-28", "One-way LCD film over one eye displaying simple images"],
    ["29-31", "A metal mechanical prosthetic arm or leg with no artificial flesh covering it"],
    ["32-33", "Reverse-jointed legs"],
    ["34-36", "Pointed or unusually-shaped ears"],
    ["37-39", "Woven nylon cord hair replacements"],
    ["40-42", "Solid steel teeth"],
    ["43-45", "A large, disfiguring scar from a life-altering injury"],
    ["46-48", "Eyes that have glowing neon rings around the pupils or irises"],
    ["49-51", "Solid subdermal implants that create ridges on your nose, arms, etc."],
    ["52-54", "Visible animal fur on often-exposed patches of skin"],
    ["55-56", "A third eye implanted at the center of your forehead"],
    ["57-58", "Retractable metal spines on your head, face, shoulders, or arms"],
    ["59-61", "Irises shaped like an icon or symbol"],
    ["62-64", "Visible metallic cyberware contact points, antennae, wires, traces, or plugs on your skin"],
    ["65-67", "Metal plating across the sides and back of your head to protect your brain"],
    ["68-69", "Animal tusks made of bone or metal"],
    ["70-71", "A chrome-plated arm or leg"],
    ["72-74", "Ears resembling a cat’s or fox’s, positioned higher up on your head"],
    ["75-77", "Artificial skin pigmentation in an unusual color, metallic tone, or unique pattern"],
    ["78-80", "Eyes or a limb that are crudely mechanical instead of human-like"],
    ["81-83", "Eyes resembling those of a cat, crow, raccoon, or other recognizable animal"],
    ["84-85", "Brightly-colored feathers instead of hair"],
    ["86-87", "Teeth coated with unusually-colored or multicolored enamel"],
    ["88-89", "Neon LED implants that light up the inside of your mouth when you talk"],
    ["90-91", "Unusually-colored sclera or eyes without visible pupils or irises"],
    ["92-93", "Prosthetic shins or forearms displaying arcing electricity inside glass tubes"],
    ["94-96", "Animated tattoos created by pigment-releasing nanomachines"],
    ["97-98", "Retractable vampire fangs"],
    ["99-100", "A patch of exposed metal or circuitry on an otherwise flesh-covered surface"],
  ];

  const objectives = [
    {
      title: "Sample objectives",
      intro: "While most objectives will be relatively straightforward, consisting of only a difficulty that the crew must overcome with their rolls, this section includes some more concrete examples of commonly-used objectives that each have some small degree of complexity to them. Administrators can use these objectives or make up their own; they are here for illustration purposes only, and you can opt into, or out of, this level of complexity based on how things are going at your table.",
      entries: [
        { name: "Get Through a Lock", tag: "Objective · Difficulty 30", text: `This objective describes the effort it takes to get through a lock on a door or window, something sturdy like a deadbolt. This objective could be progressed by picking the lock in the classic fashion, trying to kick the door in, or using some kind of makeshift armature to unlock the door from the other side.

**Non-Electronic Lock:** The Crash a System, Infiltrate a System, and Override a System skills cannot be used to progress this objective.` },
        { name: "Mine for Data", tag: "Objective · Difficulty 50", text: `This objective represents the effort it takes to navigate a complex or unfamiliar file system when searching for data. It is best used when the crew member mining for the data is under some time pressure or threat of being caught.

**Digital Fingerprints:** If Cover Your Tracks is not used to progress this objective at least once, add 2 heat ([heat][heat]) to the heat pool.` },
        { name: "Escape in a Vehicle", tag: "Objective · Difficulty 200", text: `Use this objective when crew members are attempting to escape from pursuit while in a personal vehicle. Progressing this objective involves maneuvering the crew's vehicle to put enough distance between them and their pursuers that reinforcements would not immediately be on the crew's tail.

**The Pursuers:** Use this objective only in a scene where there are enemies present pursuing the players. This scene ends one of three ways:
- The crew escapes by fully progressing this objective
- The crew escapes by defeating all pursuing enemies
- The crew is captured when their vehicle is disabled or destroyed

**Venue Change:** When the crew achieves 50, 100, and again at 150 progress toward this objective, change the nature of the environment where the chase scene is focused (moving to a different type of district, ascending or descending to different city levels, etc.). For each change, you choose one of the following hazards that best represents the nature of the new venue to be true while in that venue:
- **Dense Traffic (Hazard):** The streets are choked with other vehicles, requiring the crew to weave in and out of traffic dangerously in order to escape. Each vehicle gains the Traffic Jam x2 negative condition, which cannot be removed while in this venue. During the hazard segment of initiative, each vehicle whose driver/pilot did not succeed on a roll to Drive or Pilot Something to maneuver through traffic in the last round must make a Drive or Pilot Something roll now; on a failure, the driver/pilot takes 20 physical damage for each drawback ([drawback]) rolled as other vehicles get in the way.
- **Narrow Infrastructure:** The crew's vehicle enters a tunnel, viaduct, or other narrow confines that make maneuvering without striking the sides of the venue difficult. All vehicles and characters gain the Static Target condition, which acts as a positive condition for anyone attempting to target them with a physical attack.
- **Smog-Choked:** Dense air pollution makes seeing the dangers ahead and behind nearly impossible. The scene gains the Low Visibility scene condition, which worsens at the start of each round as the chase goes deeper into the smog-choked area.
- **Cargo Transports:** The crew's vehicle moves up alongside a cargo train or convoy of oversized transport vehicles that would cause serious damage to them in a collision. A driver/pilot of a vehicle can use their action to make a Drive or Pilot Something roll; on a success, they maneuver the vehicle to use the larger transport as cover, giving the vehicle the Behind Cover condition, which acts as a negative condition for any character attacking them. Taking this action on subsequent turns worsens this condition by one step.
- **Under Construction (Hazard):** Roads are damaged, bridges closed, raw materials are piled up beside the road, and large construction vehicles lumber slowly through the area. During the hazard segment of initiative, the hazard attacks each vehicle in the scene (50% chance of success, damage equal to 10 × the number of rounds that have passed in the conflict scene (including the current one) since the chase entered this venue).` },
        { name: "Flee Through the Network", tag: "Objective · Difficulty 200", text: `This objective represents the crew fleeing across the Network by jumping from one node to another in order to avoid capture. This particular objective is special because it can be used to replace multiple individual objectives introduced by a complication. Whenever more than 2 crew members are affected by the Locked Down complication, which traps them in the Network temporarily in order for the authorities to trace their connections back to the terminals they are using to visit the Network node. See "Locked Down" on page 229 for more information on this complication.

**The Pursuers:** Use this objective only in a scene where there are enemies present that can pursue the players. This scene ends one of three ways:
- The crew escapes by fully progressing this objective
- The crew escapes by defeating all pursuing enemies
- All crew members are reduced to 0 luck, resulting in the crew being captured as their bodies are located by the authorities

**Venue Change:** When the crew achieves 50, 100, and again at 150 progress toward this objective, the chase moves to a different node, traveling through a portal to another virtual reality. The crew's avatars remain the same, visually, when they move to the new node. The pursuers come along as well, but only human or synthetic avatars retain their current aesthetic; any automatons involved in the pursuit shift their shape to match the aesthetic of the node the scene has moved to.` },
        { name: "Long-Term Repairs", tag: "Objective · Difficulty 100", text: `This objective represents repairing something that potentially takes a long time to fix, either due to complexity or due to the extent of the damage. This objective is best used for repairing something large, like a vehicle or an oversized robot, or something that is one-of-a-kind or for which spare parts are hard to come by.

**Extended Objective:** Progressing this objective requires a montage action.` },
        { name: "Hack a Ghost", tag: "Objective · Difficulty 200", text: `This challenging objective represents the effort it takes to alter the digital backup of a person's mind, erasing or altering memories using a combination of code-based hacking and synsense production and what amounts to brain surgery. This kind of memory hacking is both difficult and time-consuming, and often the results of the effort will not be known until the ghost is loaded back into a shell.

**Delicate:** This objective requires patience and precision, with any mistake resulting in potentially catastrophic failure. Track each time an attempt to progress this objective fails or has any drawbacks on the roll; after four such instances, all progress toward the objective is lost, and the crew's advancement of the objective must begin anew.

**Extended Objective:** Progressing this objective requires a montage action.

**Uncertain Results:** Double all heat generated as a result of rolling drawbacks on a roll made to progress this objective.` },
        { name: "Navigate the Underground", tag: "Objective · Difficulty 150", text: `When the police or the corporations know the crew is on the job and districts start to lock down under oppressive martial law, sometimes the only way to get into the district is by traveling through the labyrinthine subterranean levels of the city. This objective represents the effort it takes to try and navigate through the buried tunnels and abandoned subway lines that crisscross under the city, with a very real possibility that the crew can get lost without ever making it to their target.

**Getting Lost:** Track each time an attempt to progress this objective fails or has any drawbacks on the roll; after four such instances, the current scene immediately ends, with the crew failing to achieve their goal for the scene as they must instead focus on finding their way back to the surface.` },
      ],
    },
  ];

  const obstacles = [
    {
      title: "The basics of obstacles",
      intro: `The crew members determine the nature and goals of legwork scenes, and it's up to you to make those scenes interesting and challenging with obstacles and complications. Where complications are tied directly to heat, obstacles are added to the scene by the Administrator based on the nature of the legwork scene. The best obstacles make sense in the context of the scene and feel like a natural collaboration between the Administrator and the player who initially described the nature of the scene.

The most common obstacles fall under the following categories:`,
      entries: [
        { name: "Restricted Access", text: "The crew cannot physically (or, in the Network, digitally) access the place or object they need to accomplish their goal. Locked gates, reinforced bank vault doors, piles of rubble filling a hallway, a sealed containment unit, a security door with a badge access reader, and bars over the windows are all examples of this kind of obstacle. These obstacles are usually objectives that have to be overcome to even have a chance of achieving the scene's goal." },
        { name: "Raising Alarms", text: "Typically associated with security systems, these obstacles are usually less about impeding and more about the reaction that will occur if the main goal is attempted without dealing with the obstacle first. Security cameras, laser tripwires, pressure plates, and incorrect passwords are all examples of this kind of obstacle. They often have immediate repercussions when triggered." },
        { name: "Guards/Security Automatons", text: "You can use enemies as obstacles, and not just as something the crew has to fight their way past. Enemies can be deceived, distracted, snuck past, hacked, and (of course) eliminated in order to proceed with the main objective without necessarily turning the scene into a conflict scene. See \"Using Enemies for Obstacles\" on page 217." },
        { name: "Leaving Behind Evidence", text: "An obstacle more associated with future repercussions than immediate consequences, the risk of leaving behind evidence is a common worry for criminals. Usually, these kinds of obstacles may provide a distraction to the crew members in the scene, occupying their thoughts when they need to concentrate on something else, and often they generate heat if not dealt with. Examples include a dust-covered floor that will easily leave footprints, unmonitored security cameras that nonetheless record what they see, or a data logging program in a Network node represented as a diligent, but unresponsive, scribe that chronicles everything it sees." },
        { name: "Witnesses", text: "The city is packed with law-abiding citizens who, though oppressed by the government and corporations alike, will raise an alarm or make a report to the authorities if they witness a crime. These kinds of obstacles are always people (human, or synthetic) that can be interacted with in a variety of ways, from bribery (\"This pile of credits says you didn't see anything here, get me?\") to intimidation to stealth. Most witnesses would also possess the Dramatic Enemies trait (see \"Dramatic Enemies\" on page 226), meaning that they can be quickly dispatched with violence if need be." },
        { name: "Hazards", text: "These kinds of obstacles represent something dangerous in the scene that can bring harm to some or all of the crew members in that scene. Hazards, like electrified floor tiles or industrial machinery, add an element of threat to a scene that often results in them escalating into conflict scenes, as the presence of hazards makes such scenes more thrilling; if it seems like the crew is having too easy of a time, spending heat to turn a legwork scene with a hazard into a conflict scene by introducing enemies as a complication is a reliable way to spice things up." },
        { name: "How Many Obstacles?", text: `When a player describes a legwork scene, you can follow these general guidelines for how many obstacles to describe being a part of that scene.
- If the scene is going to be short, of little consequence, or unlikely to set up a compelling dramatic situation, don't describe any obstacles.
- Otherwise, describe one obstacle. If there are more than four members of the crew participating in the job, describe two obstacles.` },
        { name: "Using Enemies for Obstacles", text: `You can use enemies (both minions, and those with luck) in lieu of one or more obstacles in your scene. Instead of creating an obstacle, you can instead say that there is an antagonist of your choosing, or a size 5 squad of minions, in the scene, putting them between the characters and their goal. If there should be two obstacles in the scene, you can instead use a minor villain or a size 10 squad of minions in lieu of two obstacles. You should usually only do this in situations where it makes sense that there would be individuals and groups directly set against the players achieving their goal.

When players attempt to deal with an obstacle involving enemies, you can track their progress toward overcoming it by tracking the depletion of luck (for enemies that have it) or by reducing the size of a minion squad (for minions). You can use this method even in nonviolent situations, such as when the crew attempts to use social skills or digital attacks to keep the enemies from interfering with the main goal of the scene.` },
      ],
    },
    {
      title: "Example obstacles",
      intro: `The following are some examples of standard, non-enemy obstacles. Usually, these are presented as hurdles that must be overcome in a legwork scene, lest they impose challenge dice on the person rolling to achieve the scene's primary goal. They should often be dealt with by another member of the crew other than the crew member taking the lead in that particular scene.

The below examples can be easily represented as a single, difficulty 50 objective, with no particular special mechanics attached to them.`,
      entries: [
        { name: "Basic Character Obstacles", text: `- A crowd has gathered, making it difficult to work without being spotted
- Other people are distracting or holding the attention of the mark
- Private security guards are walking the area, keeping an eye out for trouble
- An inebriated gang member is making a ruckus nearby, drawing eyes to the area
- An anti-corporate provocateur is stirring up a crowd of people, making it hard to access the location` },
        { name: "Basic Environmental Obstacles", text: `- The doors or windows of the building are locked or otherwise sealed
- The location is in poor repair, and both the floor and doors make unwanted noise
- The location is labyrinthine, making it easy to get lost
- An automated security checkpoint with simple metal detectors bars access to the location
- The area is covered in dust or dirt, making it easy to leave evidence behind` },
      ],
    },
    {
      title: "Security systems",
      intro: `Below are example objectives for the most common security systems found throughout the city. While many of these are similar in complexity to the basic obstacles described above, they have been expanded to the full objective format to add small amounts of texture to them that makes them feel distinct from one another, given the frequency of their use.

To determine which of these security system obstacles is appropriate for your scene, consider the security tier of the location and choose one of the systems belonging to that tier, or a lower tier (see "Security Tiers" on page 125). Or, just pick one that seems fun and appropriate; security tiers are guidelines to help you, not restrictions.`,
      entries: [
        { name: "Biometric Sensors", tag: "Objective · Difficulty 100", text: `While "biometric" sensors technically encompasses both fingerprint and retinal scanners, this objective represents advanced biometric sensors that use a combination of infrared and x-rays to identify a person based on their musculature, unique skeletal markers, and other indicators that lie beneath the skin. These sensors are sometimes preferred over fingerprint or retinal scanners because they do not require the subject to actively participate in the scanning process, which can be done secretly by cleverly-hidden sensors.

**Difficult to Sneak Past:** Rolls made to Climb, Jump, or Tumble, Run Like Hell, or Sneak Around to progress this objective automatically add 2 challenge dice ([challenge][challenge]) to the roll.

**Positive ID:** Double the amount of heat generated by drawbacks rolled when progressing this objective if the crew member who rolled is loaded into their default body and in range of the sensors, as anomalous scans are logged and passed on for evaluation.` },
        { name: "Fingerprint Readers", tag: "Objective · Difficulty 50", text: `Similar in both function and drawbacks to retinal scanners, fingerprint readers require the person attempting to pass to place one or more fingers on a tactile reader, which then identifies the person passing through based on their unique fingerprints. Fingerprints are almost impossible to replicate, resulting in at least a confident identification of the shell.

**Authorized Access:** Pressing the finger of an authorized individual onto the reader pad automatically overcomes this objective. The finger does not need to be attached to its living owner.

**Positive ID:** Double the amount of heat generated by drawbacks rolled when progressing this objective if a crew member allows their fingerprint to be scanned while loaded into their default body, as anomalous scans are logged and passed on for evaluation.` },
        { name: "Hive RFID Readers", tag: "Objective · Difficulty 200", text: `This objective represents getting through a locked door or security checkpoint requiring that the person scan their hive to verify their identity, an upgraded version of the badge reader. This objective is more difficult to bypass because it also requires the person scanning their hive to confirm that they voluntarily swiped it with a message direct to their internal HUD.

**Authorized Access:** Swiping the real hive of an individual authorized for this system over the reader automatically overcomes this objective.

**Two-Factor Authentication:** When an authorized user's badge is swiped over the reader, the reader sends a request via that hive to the owner's internal HUD, confirming that the swipe is intended. The hive's owner must respond in the affirmative (a silent response controlled by the user's thoughts) within 1 minute; failure to do so, or declining to confirm the swipe, automatically triggers connected alarm systems.` },
        { name: "Retinal Scanners", tag: "Objective · Difficulty 100", text: `Retinal scanners read the unique patterns within the retinas of the human (or synthetic) eye, which act as an identifier at least of the body that is attempting verification. While it does not guarantee the true identity of the person within the body, given how infrequently most citizens load into a shell other than their default body it is usually seen as reliable verification for all but the most secure facilities.

**Authorized Access:** Scanning the actual retinas of an individual authorized by this system automatically overcomes this objective.

**Coercion Failsafe:** If the retinal scan does not detect the telltale movements of the eye associated with consciousness, it automatically triggers a security alert and this objective can no longer be progressed.

**Positive ID:** Double the amount of heat generated by drawbacks rolled when progressing this objective if a crew member allows their retina to be scanned while loaded into their default body, as anomalous scans are logged and passed on for evaluation.` },
        { name: "Security Cameras", tag: "Objective · Difficulty 50", text: `One of the oldest and still most reliable forms of electronic security, cameras are good not only for detecting the presence of intruders but also for collecting evidence of the crimes they are committing. Though there are many ways to overcome them, from breaking them to simply moving through their blind spots, they are also inexpensive enough that they are often put up in combination with other security systems.

**Closed Circuit:** Security cameras transmit their recordings to a computer system for processing. The first time someone succeeds on a roll to Infiltrate a System to progress this objective, regardless of the impact of the roll that person gains the ability to intercept and delay audio and video transmitted from the security cameras. Any future rolls made to progress this objective cannot add heat to the heat pool for any reason.

**Fragile Hardware:** Any amount of physical damage to the cameras immediately fully progresses this objective. Add 4 heat ([heat][heat][heat][heat]) to the heat pool as the feed from the damaged cameras obviously goes dead to its observers.` },
      ],
    },
    {
      title: "Network obstacles",
      intro: `The following obstacles represent the effort required to overcome several common forms of security found in Network nodes. They can only be used in scenes in the Network, not in the physical world. These objectives can take many forms, based on the aesthetic of the node's interface; see "Network Security" on page 113 for a more in-depth examination of how each of these works, and some suggestions for how the Administrator can describe their visual appearance in a given node.

Because all of these obstacles are forms of nonsentient software (automatons), none of them can be progressed using social interaction, including purely social skills like Convince Someone, Lie to Someone, or Intimidate Someone. See "What Skills to Ask For in the Network" on page 209 for more guidance on how players can use mental skills to overcome obstacles by interacting with the virtual reality of the node.`,
      entries: [
        { name: "Automated Backups", tag: "Objective · Difficulty 50", text: `This objective involves preventing the system from automatically creating backups of any data the crew alters while in the node, which would reveal a discrepancy later when the backup is compared to the altered data. This system is the digital equivalent of unmonitored security cameras used to capture evidence. Examples of how this can appear in the Network include:
- A printing press cranking out books
- Flying monkeys carrying missives away
- A pneumatic tube messaging system
- A scowling majordomo writing furiously in a book

**Evidence Left Behind:** Ignoring this obstacle and failing to fully resolve it by the end of the scene adds 4 heat ([heat][heat][heat][heat]) to the heat pool.` },
        { name: "Distributed Data Validation", tag: "Objective · Difficulty 200", text: `This objective represents the effort required to bypass software monitoring a node for unauthorized users, one which connects to other external systems to verify that authorization. This is the digital equivalent of a robotic sentry. Examples of how this can appear in the Network include:
- A glowering, ten-foot-tall knight on guard
- A fantasy monster with a huge central eye
- A loincloth-clad cyclops sitting on a bone throne
- A menacing fiery eye atop a dark stone tower

**Deterioration:** Contacting external validators, running validation algorithms, and then receiving a response takes time, but not much. As this objective deteriorates, the virtual representation of this objective grows more directly attentive to unauthorized users, going from largely ignoring the unauthorized avatars to becoming actively hostile.

**If This Becomes Irreparable:** The external validation reveals the unauthorized nature of the users and a system administrator is contacted, who either manifests as their own avatar or takes over the form of this objective. Add a System Admin enemy to the scene, which immediately becomes a conflict scene. See the "System Admin" on page 191.

**All-Seeing Eyes:** If Infiltrate a System is not used to progress this objective at least once, add 2 heat ([heat][heat]) to the heat pool at the end of the scene.

**Timed Objective:** At the start of the round, this objective gains or worsens the Deteriorating negative condition. If it already has Deteriorating x4, it instead becomes irreparable.` },
        { name: "Encryption", tag: "Objective · Difficulty 100", text: `One of the most commonly-used obstacles in the Network, this objective represents the effort it takes to break through intentional obfuscation of data. This is the digital equivalent of writing a message in coded language. Examples of how this can appear in the Network include:
- A dusty tome full of unreadable runes
- Heavily-redacted files covered in black marks
- A video screen showing nothing but static
- A vinyl record player spouting garbled audio

**Encryption Key:** If a person interacting with this objective is in possession of the actual encryption key required for this encryption automatically overcomes this objective.` },
        { name: "Login Alerts", tag: "Objective · Difficulty 100", text: `This objective represents the effort required to avoid triggering a login alert upon entering a Network node. When visiting a node, avatars usually pass through a portal or tunnel of some kind, representing the Network connection they are traversing, giving them time to circumvent a login alert before actually manifesting in the node. This is the virtual reality equivalent of the employee at the reception desk in the lobby of an office building who inquires about the visitor's business and announces their arrival to the node's overseers. Examples of how this can appear in the Network include:
- A friendly robot receptionist in an office building
- A bored customs agent at the airport
- A robotic eye extending from inside a door
- An obsequious herald at a fancy noble's ball

**Deterioration:** There is only a limited amount of time that a login alert can be avoided. When this objective deteriorates, the visual representation of the objective grows more persistent, demanding identification.

**If This Becomes Irreparable:** The login alert sounds an alarm, warning system administrators that authorized users are attempting to operate within the node.

**Digital Fingerprints:** If Cover Your Tracks is not used to progress this objective at least once, add 2 heat ([heat][heat]) to the heat pool at the end of the scene.

**Urgent Objective:** At the start of the round, if this objective was not progressed on the last round, it gains or worsens the Deteriorating negative condition. If it already has Deteriorating x4, it instead becomes irreparable.` },
        { name: "Password Protection", tag: "Objective · Difficulty 50", text: `This objective represents the effort required to bypass a password-protected section of the Network node. These usually take the form of a lock of some kind (such as a padlock, a door lock, and so forth), and the password itself usually manifests as either a key or a combination lock that can be spun to input the correct password. Examples of how this can appear in the Network include:
- A personal safe built into the wall
- A golden treasure chest with a heavy lock
- A drawbridge controlled by a series of levers
- A puzzle box with a specific solution

**Authorized Access:** Entering an actual, authorized password that is known to the person interacting with this objective automatically overcomes this objective.` },
        { name: "Restricted Permissions", tag: "Objective · Difficulty 50", text: `Each user in a Network node is granted certain permissions, which give them access to different parts of the node and the capability to perform certain actions. This objective reflects the effort required to surpass the default permissions granted to outsiders, breaking through safeguards to get what you want. This is the digital equivalent of secure doors in an office building that require a staff badge to pass through. Examples of how this can appear in the Network include:
- A glowing forcefield with a scanner that sweeps over avatars as they approach
- A bank vault door with an electronic lock
- A towering rune-carved stone door
- An iron-banded door sealed with chains` },
        { name: "Scheduled Defragmentation", tag: "Objective · Difficulty 100", text: `To conceal something in a Network node owned by someone else, one must avoid the scheduled defragmentation, a process which sweeps through the node identifying unauthorized or anomalous code objects and quarantining them before they can do any harm. It is the digital equivalent of after-hours staff sweeping through a closed building to make sure everything is OK. Examples of how this can appear in the Network include:
- Robot vacuum cleaners sweeping through a room
- A doddering security guard with a flashlight
- A hovering gyroscopic drone drifting around slowly
- Cartoon rats scurrying around in the dark

**Deterioration:** As this objective deteriorates, the virtual representation of the obstacle draws closer and closer to the crew's avatars or any malicious code or outside program they have brought with them into the node.

**If This Becomes Irreparable:** The system identifies the unauthorized code and isolates it. If the crew has a virus or other program that they have created within, or brought into, the Network node, it is immediately destroyed. Add a number of Security Agent antagonists to the scene equal to the number of crew members in the scene, who are hostile to the crew. The scene immediately becomes a conflict scene. See the "Security Agent" on page 191.

**Urgent Objective:** At the start of the round, if this objective was not progressed on the last round, it gains or worsens the Deteriorating negative condition. If it already has Deteriorating x4, it instead becomes irreparable.` },
        { name: "Tracebacks", tag: "Objective · Difficulty 50", text: `This objective represents what is required to overcome tracebacks, a form of trap that pins someone in the Network and gives the node's administrators a chance to trace the avatar's connection back to the terminal their user is connected to in the physical world. Examples of how this can appear in the Network include:
- A trap door in the floor leading to a pit
- A thick rope net lying under dead animal bait
- A paralysis beam projector
- A cube-shaped forcefield

**Locked Down:** Any avatar that falls into the trap presented by this objective is automatically affected by the Locked Down complication. The Administrator does not need to spend heat for this complication. See "Locked Down" on page 229.` },
      ],
    },
  ];

  const complications = [
    {
      title: "Minor complications (5 [heat])",
      intro: "These complications provide interesting tension for a single scene.",
      entries: [
        { name: "Access Denied", text: "The crew trips a security system and doors, elevators, windows, and other methods of egress in the players' vicinity become temporarily locked (or encrypted, in the Network) while security teams investigate. Add a difficulty 50 objective to the scene to circumvent the locks." },
        { name: "Active Pursuit", text: "Use this complication any time you introduce minions or antagonists into a scene as obstacles. The introduced characters are familiar with the crew members' appearances (for their default bodies, or the avatars they have used in the Network) and affiliations, and they have reason to suspect that the crew is engaged in illegal activity. If the crew members did not take precautions before entering the scene to disguise themselves in some way, the enemies attempt to arrest, kill, or otherwise subdue the crew members immediately upon becoming aware of their presence." },
        { name: "Alert", text: "The law-abiding citizens in the scene are on the lookout for people who are where they shouldn't be, set on edge by public service announcements from the government and the corporations. Add the Neighborhood Watch x2 negative condition to the scene, which applies to any roll made to Infiltrate a System, Sneak Around, or otherwise engage in covert illegal activity." },
        { name: "Broken Gear", tag: "Only scenes in the physical world", text: "Use this complication when a crew member fails a roll while using a piece of gear or a weapon. The piece of gear or weapon becomes immediately broken." },
        { name: "DDoS", tag: "Only scenes in the Network", text: "The network node the scene takes place in is under a denial-of-service attack coordinated by rival hackers or corporate technicians, causing stuttering lag in the virtual world. Add the Terrible Lag x2 negative scene condition to the scene, which affects all participants (including Administrator characters) in the node." },
        { name: "Escalate an Objective", tag: "During a scene only", text: `Choose one objective in the scene to suddenly become more immediately dangerous, turning it into an urgent objective. The nature of the change depends on the objective, and the results of failing to deal with that objective (when the objective becomes irreparable) increase in one of the following ways:
- Immediately add a negative condition (severity x4) to the entire scene
- Immediately introduce a major complication into the scene
- Immediately add a hazard to the scene` },
        { name: "Fried Circuits", tag: "Only in scenes in the Network", text: "Use this complication when a crew member is hit by a digital attack to represent a surge of electricity that flows through the Network to affect their hardwired connection to the Network. The crew member takes 2 wounds as electricity surges through the link into their bodies. Use this complication on the same crew member no more than once per round." },
        { name: "Hardwired Connections", tag: "Only in scenes in the physical world", text: "Use this complication when you add an obstacle to a scene involving security systems or alarms. The obstacle is connected to its alarm systems via physical wiring and cannot be hacked or modified at range. Crew members must be up close to these objectives in order to attempt to progress them, and must physically connect to these systems via input/output ports on the objective to whatever gear they are using to hack the objective." },
        { name: "Heavy Hitter", text: `Use this complication any time you would introduce an antagonist into a legwork scene as an obstacle. Instead, introduce a minor villain as the obstacle; if a crew member attempts to accomplish the main goal of the scene before the minor villain is defeated or otherwise dealt with, the Administrator chooses one of the following, based on what makes the most sense in the context of the scene:
- The attempt to achieve the main goal of the scene automatically fails, as it is foiled by the minor villain, and the scene ends with the crew escaping empty-handed
- The minor villain gets a lucky break and stumbles upon the crew's attempt; the scene immediately becomes a conflict scene as the minor villain attempts to subdue the crew members involved, and add a difficulty 100 objective to the scene to escape from the minor villain
- Add 8 heat to the heat pool at the conclusion of the scene as the minor villain starts working against the crew behind the scenes` },
        { name: "Intensify an Objective", text: "Use this complication any time you introduce an objective into a scene as an obstacle. Increase the difficulty of the objective to 100." },
        { name: "Locked Down", tag: "Only in scenes in the Network", text: `One of the crew members in the scene is targeted by a lockdown attack, which forces them to stay connected to the Network. Add an objective (difficulty 50) to the scene, representing the program that is keeping the crew member forcibly connected. If anyone takes an action that would forcibly remove the targeted crew member from the Network (for example, by shutting down the power to the computer linking them to the Network), the crew member immediately takes 4 wounds from neural trauma. When the objective is fully resolved, the player can exit the Network as normal. Crew members immune to digital attacks cannot be targeted by this complication.

For every 2 heat ([heat][heat]) the Administrator spends when introducing this complication in excess of the base heat cost, one additional crew member is affected by this complication. Each crew member has a separate objective they must resolve in order to safely disconnect.` },
        { name: "Reinforcements", tag: "During a scene only", text: "Reinforcements arrive to back up minions already present in the scene. Add a squad of minions to the scene of a size equal to the number of crew members in the scene x 3 of the same type as another squad in the scene." },
        { name: "Severe Pollution", text: "Air and water filtration systems have been damaged or failed in this district, and as a result the district is cloaked in a fog of pollution that makes operating in the district difficult. Add the Cloud of Pollution x2 negative scene condition to the scene. This condition only affects human characters and other biologicals." },
        { name: "Signal Jamming", text: "The authorities have detected unsanctioned wireless signals or unusual Network traffic, and have disrupted those specific signals. Choose one crew member present in the scene; for the rest of the scene, that crew member must be up close or near to any computerized device at this location in order to interact with it in any way. The chosen crew member also loses access to the global wireless Network and intra-crew wireless data communication at this location." },
        { name: "Unexpected Enemies", text: "People present in the scene could make it difficult for the crew to accomplish its task. Add an antagonist or a squad of minions to the scene, of a size equal to the number of crew members in the scene x2." },
        { name: "Wary", text: "A character in the scene is wary of being targeted by outlaws. Add the Deeply Suspicious x2 condition to that character, which acts as a negative condition for anyone attempting to deceive them." },
      ],
    },
    {
      title: "Major complications (10 [heat])",
      intro: "These complications pose more significant threats to the crew and might require the entire crew to pitch in to overcome safely.",
      entries: [
        { name: "APB", text: "Video screens and holograms throughout the district in which the scene takes place are displaying images of members of the crew. Each crew member that is not sufficiently disguised adds 2 heat ([heat][heat]) to the heat pool at the start of any scenes in this district for the remainder of the job." },
        { name: "Copy Captured", text: "Use this complication only if one of the members of the crew has created a copy of their consciousness already during the job. One of those copies is captured and brutally interrogated, giving up their secrets. That crew member's maximum luck is halved for the remainder of the job, as they feel the weight of the target on their back." },
        { name: "Deadly Enemies", text: `Use this complication any time you would introduce an antagonist into a legwork scene as an obstacle. Instead, introduce a major villain as the obstacle; if a crew member attempts to accomplish the main goal of the scene before the major villain is defeated or otherwise dealt with, the Administrator chooses one of the following, based on what makes the most sense in the context of the scene:
- The attempt to achieve the main goal of the scene automatically fails, as it is foiled by the major villain, and the scene ends with the crew escaping empty-handed
- The major villain gets a lucky break and stumbles upon the crew's attempt; the scene immediately becomes a conflict scene as the major villain attempts to subdue the crew members involved
- Add the major villain as an obstacle to any subsequent scene without spending heat to do so, along with a squad of minions of a size equal to the number of crew members x3` },
        { name: "Heavy Police Presence", text: "One district in the city that you choose has a significantly increased presence of police forces or private security guards, as suspicions have been raised about the crew's operations in that district. For the remainder of the job, any scene taking place in the chosen district also has a squad of C11: The Private Security Firm or M05: The Police minions of a size equal to the number of crew members x 2 in it. The presence of these minions is in addition to any obstacles that would normally be in the scene." },
        { name: "Psionic Disturbance", text: "Something in the scene is disrupting the incredible abilities allowed by psionic augmentations; any time a crew member in this scene expends luck to activate a psionic augmentation, they must spend 5 extra luck." },
        { name: "Raid", text: "Use this complication at any time during a planning scene. The authorities have learned of the crew's activities and have dispatched a team to capture them. Two size 10 squads of C11: The Private Security Firm or M05: The Police minions and two lieutenant antagonists violently interrupt the scene and try to detain the crew, turning the planning scene into a conflict scene. Once the conflict scene is over, the day ends." },
        { name: "Rival Crew", text: `Use this complication at the start of a day, before the crew declares what they are going to do that day. Another group of criminals is on a job that conflicts with the crew's job. This rival crew wants the players to recess for a full day so they can finish their job first. If the crew agrees, they must use this day for planning.

If the crew refuses, the rival crew threatens to make things difficult for the players. During any subsequent scene, that crew can show up at any time, provoking a fight or trying to actively sabotage the crew. The rival crew consists of a size 5 squad of the Right Kind of People minions, as well as 1 criminal antagonist.` },
        { name: "Service Disruption", text: "The broadcast and repeater nodes for the global wireless network in this district are damaged or in disrepair for the time being. For the rest of the scene, crew members at this location must be up close to any computerized device in order to interact with it in any way, and they lose access to the global wireless Network and any intracrew wireless data communication at this location." },
        { name: "Supremely Challenging Objective", text: "Use this complication any time you introduce an objective into a legwork scene as an obstacle. Increase the difficulty of the objective to 200." },
        { name: "They're On to Us", tag: "Only in scenes in the physical world", text: "Use this complication when a legwork scene would otherwise end to instead have the scene continue as the police, private security guards, or other law enforcement or corporate agents follow the crew members as they are leaving wherever the scene is taking place, attempting to arrest, kill, or capture the crew. The scene immediately becomes a conflict scene, and you add a chase objective (such as The Car Chase example) and a squad of minions of a size equal to the number of crew members in the scene x 3 as the pursuers." },
        { name: "They Found Us!", tag: "Only in scenes in the Network", text: `Someone that the crew opposes has hunted them down and waits for an opportune moment to strike. While members of the crew are engaged in the Network, attackers storm the supposedly-safe location where their bodies lie vulnerable. Each player that is not in the current scene now becomes part of a second, parallel conflict scene in the physical world.

The attackers consist of a squad of minions (size equal to 3 x the number of crew members not currently in the Network), 2 antagonists, and a minor villain. If the members of the crew involved in the scene in the physical world alert the players in the Network of what is going on, any player that wishes to disconnect from the Network (leaving that scene) can participate in the conflict scene starting on the next round.

If the crew cannot overcome the attackers, or if there are no crew members who were not a part of the scene in the Network to engage in the conflict scene in the first place, the members of the crew in the Network are captured by their attackers and prematurely pulled from the Network, ending that scene.` },
        { name: "Unexpected Hazard", text: `When the scene starts, the location where the scene is meant to take place is currently the site of an unexpected hazardous situation. Add a hazard to the scene, which automatically becomes a conflict scene (even if there are no "enemies" per se in the scene).

Some examples of hazards that could be added to the scene include:
- A reckless street gang sets the building on fire
- Poorly-programmed cleaning drones slam into unwary crew members
- A corporate headquarters vents excess coolant into occupied alleys
- Incomplete utility construction leaves downed electrical lines in the street
- Downtrodden citizens are rioting in the area of the scene, lashing out indiscriminately
- A nasty virus has infected the Network node where the scene is taking place and attempts to crash out anyone in the node
- Someone is pulling the plug on the servers that run the Network node, and it is collapsing around the crew's avatars` },
      ],
    },
    {
      title: "Plot twists (20 [heat])",
      intro: `When the heat pool grows sufficiently large, you can spend 20 heat to introduce a plot twist. These are major shifts in the job's narrative that can have a critical impact on the crew and their plans. A plot twist should be something that forces the crew to reevaluate their plans, coming out of nowhere to take them by surprise.

There are no specific mechanics for the plot twist you introduce. As the Administrator, introducing a plot twist gives you a free hand in shoving the narrative in a different direction, and is the strongest meddling you can do during a job. While some jobs will include suggested plot twists in their description, ultimately a plot twist is a chance for you to get creative and take your players by surprise.`,
      entries: [
        { name: "Plot Twists Should...", text: `- Be more impactful than major complications
- Involve characters or locations the players have interacted with during this or a previous job
- Subvert the crew's expectations about a location, character, asset, or obstacle
- Stoke a feeling of indignity or betrayal toward a character or group in the setting` },
        { name: "But They Should Not...", text: `- Sideline one or more players entirely (i.e. you shouldn't use a plot twist to have a crew member assassinated "off-camera")
- Cause the crew to immediately fail the job
- Stoke a feeling of resentment toward you, the Administrator
- Fundamentally change the job's score, mark, or other major elements so much that all of the crew's preparation up to that point is rendered meaningless` },
        { name: "Example Plot Twists", text: `- A member of the mark's private security team, who the crew has bribed to stand aside and let them in without raising an alarm, has been playing them for fools all along. He has a squad of security guards poised to try and capture the crew when they break in, and has changed all of the access codes in the estate so that any previously-stolen codes are no longer valid.
- Someone else got to the target first, and kidnapped them before the crew could. When the crew arrives to capture the executive scion, they find him already missing. A rival crew has already pulled off the kidnapping and is making their escape with the target, making their way up to the rooftop where their getaway vehicle awaits.
- The date of the executive gala has been unexpectedly moved up by a day, reducing the amount of time the crew has to plan and prepare by a day. With time so short, they will have to pull off the heist with only some of their preparations in place, improvising everything else along the way.` },
      ],
    },
  ];

  const headlines = [
    { title: "Table X-1: Who is the subject?", head: ["d100", "Faction/Person in the News"], rows: [
      ["01-04", "C01: The Bank"],
      ["05-08", "C02: The Construction Company"],
      ["09-12", "C03: The Consumer Goods Manufacturer"],
      ["13-16", "C04: The Digital Security Firm"],
      ["17-20", "C05: The Food Supplier"],
      ["21-24", "C06: The Franchise Chain"],
      ["25-28", "C07: The Gig Work Facilitator"],
      ["29-32", "C08: The Industrialist Company"],
      ["33-35", "C09: The Law Firm"],
      ["36-39", "C10: The Media Company"],
      ["40-43", "C11: The Pharmaceutical Company"],
      ["44-47", "C12: The Private Security Firm"],
      ["48-51", "C13: The Robotics Manufacturer"],
      ["52-55", "C14: The Shipping Company"],
      ["56-59", "C15: The Software Firm"],
      ["60-63", "C16: The Sports Franchise"],
      ["64-67", "C17: The Taxi Service"],
      ["68-71", "C18: The Vehicle Manufacturer"],
      ["72-75", "C19: The Weapons Manufacturer"],
      ["76-78", "P09: The Government Figurehead"],
      ["79-81", "P13: The Nefarious Executive"],
      ["82-85", "X01: The City Government"],
      ["86-89", "X04: The Mercenary Group"],
      ["90-93", "X04: The Military"],
      ["94-97", "X06: The Police"],
      ["98-100", "X08: The Religious Group"],
    ] },
    { title: "Table X-2: What happened?", head: ["d100", "Event"], rows: [
      ["01-07", "...has won a legal battle over..."],
      ["08-19", "...is being accused of polluting/poisoning..."],
      ["20-31", "...clashed violently with..."],
      ["32-43", "...is responsible for a tragic accident involving..."],
      ["44-50", "...publicly denounced..."],
      ["51-62", "...stole/embezzled a large amount of money from..."],
      ["63-73", "...took something valuable from..."],
      ["74-80", "...brokered a lopsided deal with..."],
      ["81-87", "...has lobbied the government for action against..."],
      ["88-100", "...destroyed the homes/other property of..."],
    ] },
    { title: "Table X-3: Who is the victim?", head: ["d100", "Victim"], rows: [
      ["01-20", "Roll again on Table X-1"],
      ["21-25", "An individual citizen"],
      ["26-35", "The citizens of a particular district"],
      ["36-45", "A group of employees"],
      ["46-50", "A person or group outside the city"],
      ["51-55", "A specific group of people using the Network"],
      ["56-60", "A group of transients or other downtrodden people"],
      ["61-65", "Tourists or visitors from another place"],
      ["66-85", "The inhabitants of a particular district"],
      ["86-90", "The P05: Celebrity"],
      ["91-100", "The Right Kind of People"],
    ] },
    { title: "Table X-4: What motivated this event?", head: ["d100", "Driving Force"], rows: [
      ["01-08", "Quarterly profit margins"],
      ["09-16", "A personal grudge"],
      ["17-26", "Covering up something even worse"],
      ["27-34", "The whims of an individual executive"],
      ["35-44", "Avoiding the consequences for something else"],
      ["45-52", "A large financial transaction between wealthy parties"],
      ["53-60", "A bid for political power"],
      ["61-70", "Sabotaging some undertaking of a third party (roll on Table X-1 for the third party)"],
      ["71-78", "A warning meant for someone else"],
      ["79-88", "Corporate espionage"],
      ["89-96", "A threat from the P12: Malevolent Elder God"],
      ["97-100", "A prediction from the P12: Oracular Elder God"],
    ] },
    { title: "Table X-5: How did the victim respond?", head: ["d100", "Response"], rows: [
      ["01-07", "They publicly vowed retaliation"],
      ["08-15", "They have issued no response so far"],
      ["16-22", "They have made pleas for sympathy from the public"],
      ["23-30", "They have gone into hiding or secreted people away"],
      ["31-38", "They have released damning information about the perpetrator"],
      ["39-45", "They have denied being victimized at all"],
      ["46-52", "They have petitioned the government for justice"],
      ["53-60", "They have set the X09: Secret Police on the subject"],
      ["61-68", "They have hired the G01: Body Butchers to exact revenge"],
      ["69-70", "They have bribed the G02: Cult to interfere with the subject"],
      ["71-77", "They have paid the G03: Terrorist Group to attack the subject"],
      ["78-84", "They have cut a deal with the G04: Untrustworthy Cartel to target the subject"],
      ["85-92", "They have scapegoated one of their own"],
      ["93-100", "They or some of their number have fled the city"],
    ] },
    { title: "Table X-6: What truth does the story hide?", head: ["d100", "Covered-Up Secret"], rows: [
      ["01-07", "Dozens of citizens died and their deaths were covered up"],
      ["08-13", "Something dangerous has gone missing during these events"],
      ["14-18", "A team of criminals was involved"],
      ["19-24", "The event was a distraction shielding a corporate defection"],
      ["25-30", "Several citizens have gone missing without a trace"],
      ["31-36", "The official story blames the P01: Anarchist Demagogue"],
      ["37-42", "The official story blames the P02: Arms Dealer"],
      ["43-48", "The official story blames the P06: Crime Lord"],
      ["49-54", "The official story blames the P07: Cult Leader"],
      ["55-62", "The official story blames the P08: Cyberterrorist"],
      ["63-68", "The event was orchestrated by the P10: Inscrutable Elder God"],
      ["69-74", "The event was the work of the X09: Secret Police"],
      ["75-80", "Someone's ghost was irrecoverably corrupted"],
      ["81-86", "Someone very powerful was directly involved"],
      ["87-92", "The event was facilitated by a traitor"],
      ["93-98", "A disaster was narrowly avoided"],
      ["99-100", "The event involved a player faction not controlled by any of the players in the session"],
    ] },
  ];
  for (const t of headlines) t.question = t.title.replace(/^Table X-\d+: /, "");

  function headlineNews(rng) {
    const { rollTable } = root.NCD_DICE;
    const roll = (t) => { const r = rollTable(t, rng); return { total: String(r.total).padStart(2, "0"), text: t.rows[r.row][1] }; };
    return headlines.map((t) => {
      const first = roll(t);
      if (!/Table X-1/.test(first.text)) return { question: t.question, text: `${first.total}: ${first.text}` };
      const again = roll(headlines[0]);
      const before = /^Roll again/.test(first.text) ? first.total
        : `${first.total}: ${first.text.replace(/\s*\(roll on Table X-1[^)]*\)/, "")}`;
      return { question: t.question, text: `${before}, then ${again.total}: ${again.text}` };
    });
  }

  root.NCD_TABLES = { randomKeywordsIntro, randomKeywords, securityTiers, alarmHeatIntro, alarmHeat, securityDefenses, liabilities, distinctiveTraits, objectives, obstacles, complications, headlines, headlineNews };
})(globalThis);
