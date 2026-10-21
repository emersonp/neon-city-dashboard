// The Tables tab's tables, from the rulebook: what the Administrator rolls on or looks up during a session.
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
  const alarmHeatIntro = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
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

  root.NCD_TABLES = { randomKeywordsIntro, randomKeywords, securityTiers, alarmHeatIntro, alarmHeat, securityDefenses, liabilities, distinctiveTraits };
})(globalThis);
