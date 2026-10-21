// The Tables tab's tables, from the rulebook: what the Administrator rolls on or looks up during a session.
// No page code here, so it can be tested in Node. Text uses the format.js description format, like databank.js.
//
// randomKeywords  the random gear keywords table: [range, positive, negative]
// securityTiers   the security system tiers: { name, text, defenses: [names, as the table shows them] }, and securityTiersOutro
// securityDefenses the security systems the tiers' defenses name: { name, tag?, text }. A defense in a tier links to the
//                 one here of the same name (any case); X-ray scanners are described but in no tier.
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
  const securityTiersOutro = "Administrators can find objectives modeled after these security systems for use as obstacles, under “Security Systems” on page 218.";
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

  root.NCD_TABLES = { randomKeywordsIntro, randomKeywords, securityTiers, securityTiersOutro, securityDefenses };
})(globalThis);
