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
// complications   the complications the Administrator spends heat on, in the rulebook's three groups (minor, major,
//                 plot twists): { title, intro, entries: [{ name, tag?, text }] }; the title's [heat] is the icon
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

  root.NCD_TABLES = { randomKeywordsIntro, randomKeywords, securityTiers, alarmHeatIntro, alarmHeat, securityDefenses, liabilities, distinctiveTraits, complications };
})(globalThis);
