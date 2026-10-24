// The GM Screen tab's Adversaries: the rulebook's Enemies chapter, every enemy's stat block in the book's order.
// No page code here, so it can be tested in Node. Text uses the format.js description format, like tables.js.
//
// TYPES       the kinds of enemy, weakest first, as the stat blocks name them
// adversaries { name, type (one of TYPES), luck (null for a minion squad), network (a threat in the Network: its stats
//             are only for scenes there), portrait (its face from the book's art, 256 pixels square, in
//             portraits/adversaries/; the Network threats have no art), text, attacks: [[name, text]],
//             perks: [[name, text]] }
(function (root) {
  const TYPES = ["Minion squad", "Antagonist", "Minor villain", "Major villain"];

  // The perks many enemies share, word for word.
  const COLLECTIVE = ["Collective Strength", "Every successful attack (or boon on an attack) reduces the squad's size by 1."];
  const DRAMATIC = ["Dramatic Enemy", "Physical attacks against this character are treated as though the character has 0 luck."];
  const ODDS = ["Against All Odds", "Add 1 challenge die ([challenge]) to attack rolls against this enemy for each time it has been attacked this round."];
  const AMBITION = ["Ambition", "When this character deals mental damage with an attack they also regain 10 luck."];
  const BRIBE = ["On the Take", "Add 1 advantage die ([advantage]) to any roll made to bribe this character."];
  const SYNTHETIC = ["Synthetic Body", "This character cannot be affected by poisons, diseases, or non-physical psionic attacks."];
  const BLOODTHIRSTY = ["Bloodthirsty", "This character regains all their lost luck each time they wound an opponent with an attack."];
  const WRONG_KIND = ["The Wrong Kind of People", "If the Administrator spends heat to add this character to a scene, add another one of this character without spending additional heat."];
  const UNEXPECTED = ["Unexpected", "When the Administrator spends heat to add this character to a scene, the character's presence is not revealed until they attack for the first time."];
  const SKEPTIC = ["Skeptic", "Add 1 challenge die ([challenge]) to non-physical attack rolls made to convince or coerce this character in some way."];
  const SUSPICIOUS = ["Naturally Suspicious", "Add 1 challenge die ([challenge]) to non-physical attack rolls made to deceive this character in some way."];
  const brutal = (wounds) => ["Brutal", `When this character reduces a target to 0 luck with a physical attack, the target also takes ${wounds} wound${wounds > 1 ? "s" : ""}.`];
  const superiority = (dice) => ["Superiority Complex", `Add ${dice} challenge ${dice > 1 ? "dice" : "die"} (${"[challenge]".repeat(dice)}) to any roll made for a mental attack against this character by anyone who does not appear to be an executive.`];
  const hidden = (heat, who = "a minor, background character") => ["Hidden Among Us", `The Administrator can spend ${heat} heat (${"[heat]".repeat(heat)}) at any time in a legwork scene to declare that ${who} in that scene is actually this character.`];
  const summon = (name, minions) => [name, `The Administrator can spend 5 heat (${"[heat]".repeat(5)}) to add a squad of ${minions} minions (of a size equal to the number of crew members in the scene x2) at any time.`];
  const anything = (damage) => ["Anything Else", `50%, ${damage} damage`];
  const SQUAD_ELSE = ["Anything Else", "50%, damage equal to the squad's size x5"];

  const adversaries = [
    {
      name: "Private Security Guards", type: "Minion squad", portrait: "private-security-guards.png",
      text: "On equal footing with the city's police in terms of authority, and far outstripping them in resources and personnel, private security companies dispatch guards to protect the interests of their corporate clients. They answer only to the executives and have a well-earned reputation for being bullies and stooges of their corporate fascist employers.",
      attacks: [["Shock Clubs", "50%; physical damage equal to the squad's size x5; renders a target unconscious if it reduces them to 0 luck"]],
      perks: [COLLECTIVE],
    },
    {
      name: "Security Drones", type: "Minion squad", portrait: "security-drones.png",
      text: `Disposable and deadly, swarms of flying security drones are among the most common automated security systems across the city. These kinds of drones come in dozens of indistinguishable models that all serve the same purpose: kill intruders with enough plausible deniability that they can be labeled as "evidence collection devices."`,
      attacks: [["Micro Chain Gun", "65%; physical damage equal to the squad's size x5"], SQUAD_ELSE],
      perks: [["Automaton", "This squad of minions is immune to mental attacks."], COLLECTIVE],
    },
    {
      name: "Private Security Captain", type: "Antagonist", luck: 70, portrait: "private-security-captain.png",
      text: "Rising from the ranks of private security guards, captains are rewarded for their loyalty (and their ability to save their company money) with the responsibility of command over a small security team. While they have certainly bought into their company's supposed mission statement, they are ultimately still just citizens.",
      attacks: [["Energy Sword", "75%; 45 physical damage"], ["Rail Pistol", "60%; 55 physical damage; add 1 advantage die ([advantage]) to rolls made to attack targets that are far away"], anything(20)],
      perks: [["Inspire Discipline", "Any mental attack made against private security guards under this character's command adds one challenge die ([challenge]) on the roll."]],
    },
    {
      name: "Private Security Director", type: "Minor villain", luck: 250, portrait: "private-security-director.png",
      text: "Though they often paint a picture of themselves as foot soldiers who rose through the ranks through hard work and gumption, in reality most of the management within private security corporations are drawn from the executive class, the inheritors of vast fortunes who get their thrills directing their charges to beat up protesters.",
      attacks: [["Debilitating Pistol", "90%; 35 physical damage and the target gains the **Debilitated** condition"], ["Concussion Baton", "65%; 50 physical damage and push the target away from this character to be at near distance"], anything(20)],
      perks: [["Chain of Command", "If private security guard minions are defending this character in the scene, add 2 challenge dice ([challenge][challenge]) to rolls made for physical attacks against this character."]],
    },
    {
      name: "Corporate Goons", type: "Minion squad", portrait: "corporate-goons.png",
      text: `While the megacorporations of the city contract with the private security companies, they also employ a cadre of vetted, deeply-loyal muscle that directly report to their management teams and can be trusted with the most sensitive jobs. They often work as bodyguards, clean-up crews, and leg-breakers who visit enemies of the corporations to "send a message."`,
      attacks: [["Flechette Pistol", "50%; physical damage equal to the squad's size x5; add 1 advantage die ([advantage]) to rolls made to attack targets that are up close to this character"], SQUAD_ELSE],
      perks: [COLLECTIVE, ["Goon Squad", "If the Administrator spends heat to add these minions to a scene containing an executive, add a second identical squad without spending additional heat."]],
    },
    {
      name: "Corporate Collaborator", type: "Antagonist", luck: 90, portrait: "corporate-collaborator.png",
      text: "Eager to show their executive superiors their value in the hopes of one day joining their ranks, corporate collaborators perpetuate the corrupt system and maintain the status quo, sycophants with delusions that one day they will be the ones in charge.",
      attacks: [["Recognize Deception", "75%; 45 mental damage"], ["Interrogate", "60%; 55 mental damage"], anything(20)],
      perks: [AMBITION, DRAMATIC],
    },
    {
      name: "Privileged Scion", type: "Antagonist", luck: 90, portrait: "privileged-scion.png",
      text: "Nepotism among the executive class isn't just a dirty secret no one talks about, it's an expectation that results in the children of executives finding themselves in positions of power as soon as the other executives can be convinced they are ready for the responsibility.",
      attacks: [["Intimidation", "75%; 45 mental damage"], anything(20)],
      perks: [DRAMATIC, ["Inherited Resources", "When the Administrator spends heat to add a squad of minions to a scene this character is in, increase the size of the minion squad by 2."], superiority(1)],
    },
    {
      name: "Bodyguard", type: "Antagonist", luck: 70, portrait: "bodyguard.png",
      text: "If there is only one thing that executives are more certain of than their own superiority, it's that everyone else is out to get them. Most executives employ experienced, heavily-augmented bodyguards whose only job is to make sure that anyone foolish enough to get too close without authorization will be looking for a new shell.",
      attacks: [["Shock Pistol", "75%; 45 physical damage; renders a target unconscious if it reduces them to 0 luck"], ["Fists and Feet", "60%; 55 physical damage"], anything(20)],
      perks: [["Bodyguard's Charge", "If this character is defending an executive in a scene, physical attacks against the executive add two challenge dice ([challenge][challenge]) on the roll."]],
    },
    {
      name: "Junior Executive", type: "Minor villain", luck: 275, portrait: "junior-executive.png",
      text: "While everyone within the executive class is an ultra-rich oligarch, there is still a hierarchy of power that leaves some power-hungry officers of the corporations subservient to their wealthier, longer-lived peers. These junior executives play the role of the loyal subordinate, all the while sharpening their knives and biding their time.",
      attacks: [["Interrogate", "95%; 35 mental damage"], anything(25)],
      perks: [AMBITION, DRAMATIC, superiority(2)],
    },
    {
      name: "Corporate Troubleshooter", type: "Antagonist", luck: 70, portrait: "corporate-troubleshooter.png",
      text: "Every corporation employs some number of individuals who make problems go away, by any means possible. These troubleshooters will bribe, threaten, and coerce, but they particularly enjoy getting their hands dirty when covertly dispatched by an executive.",
      attacks: [["Shock Knuckles", "75%; 45 physical damage; renders a target unconscious if it reduces them to 0 luck"], ["Hacking", "65%; 50 digital damage"], ["Coercion", "65%; 50 mental damage"], anything(20)],
      perks: [ODDS],
    },
    {
      name: "Senior Executive", type: "Major villain", luck: 600, portrait: "senior-executive.png",
      text: `The term "executive," once purely a job title, is now a moniker that implies both social class as well as longevity. The most powerful executives are wealthy beyond imagination, and thus near-immortal since they can afford frequent backups and replacement bodies.`,
      attacks: [["Issue Commands", "90%; 55 mental damage"], ["Peer Into their Soul", "65%; 75 mental damage"], anything(30)],
      perks: [ODDS, DRAMATIC, ["Secret Protector", `The Administrator can spend 5 heat (${"[heat]".repeat(5)}) to add a Bodyguard antagonist to a scene with this character in it at any time.`], superiority(2)],
    },
    {
      name: "Bootlicker Citizen", type: "Antagonist", luck: 50, portrait: "bootlicker-citizen.png",
      text: "Some citizens think the system works, that anyone who isn't thriving (for some mediocre definition of thriving) is a shiftless layabout. They have unwavering loyalty to the corporations they work for and will always sound the alarm if they see anything illegal happening.",
      attacks: [["Get Under Their Skin", "75%; 45 mental damage"], ["Looking for Trouble", "60%; 55 mental damage"], anything(20)],
      perks: [DRAMATIC],
    },
    {
      name: "Minor Bureaucrat", type: "Minor villain", luck: 100, portrait: "minor-bureaucrat.png",
      text: "Typically found in government offices or in offices where paperwork and protocol are the name of the game, these minor bureaucrats are occasionally stumbling blocks for crews but can be appeased by appealing to their greed.",
      attacks: [["Probing Questions", "75%; 45 mental damage"], anything(20)],
      perks: [DRAMATIC, BRIBE],
    },
    {
      name: "Wary Citizen", type: "Antagonist", luck: 50, portrait: "wary-citizen.png",
      text: "The citizens of the city are well aware of the dangers the criminals of the city pose, and most react to that danger with caution or fear. Some, however, see themselves as the only ones who can see through the cons and the grifts. They aren't sheep like the rest of the citizens, they know what's really going on. They are naturally suspicious, and are just looking for a chance to uncover the rot that eats away at heart of the city.",
      attacks: [["Looking for Trouble", "75%; 45 mental damage"], anything(20)],
      perks: [DRAMATIC, SUSPICIOUS],
    },
    {
      name: "Corrupt Official", type: "Minor villain", luck: 275, portrait: "corrupt-official.png",
      text: "Out of one side of their mouth, they claim to be servants of the people who will do their civic duty and fight for the citizens. Out of the other, they pay tribute to the corporations. Many people in positions of governmental authority take bribes from the corporations, bending (and breaking) the law in the executives' favor.",
      attacks: [["Veiled Threats", "90%; 35 mental damage"], ["Detect Subterfuge", "65%; 50 mental damage"], anything(25)],
      perks: [DRAMATIC, SUSPICIOUS, BRIBE],
    },
    {
      name: "Frayed Youths", type: "Minion squad", portrait: "frayed-youths.png",
      text: "Young people who get their hands on illegal hive injections before their minds have finished developing often suffer psychosis and stunted social development. Gangs of unstable youths prowl the streets, a threat to citizens and a thorn in the side of the Right Kind of People.",
      attacks: [["Makeshift Weapons", "50%; physical damage equal to the squad's size x5; renders a target unconscious if it reduces them to 0 luck"]],
      perks: [COLLECTIVE, ["Damaged Minds", "Add 1 advantage die ([advantage]) to any roll made to distract or deceive this squad."]],
    },
    {
      name: "Street Gang", type: "Minion squad", portrait: "street-gang.png",
      text: "Not everyone who is a criminal is one of the Right Kind of People. An oppressive society produces ruffians who prey on the law-abiding, paying the abuse they once suffered at the hands of an unfair system forward by flouting the law and bullying the weak. These rougher criminals band together into street gangs, small bands that carve up districts into turf they defend against other gangs.",
      attacks: [["Jagged Clubs", "65%; physical damage equal to 5 + (the squad's size x5)"]],
      perks: [COLLECTIVE],
    },
    {
      name: "Street Gang Leader", type: "Antagonist", luck: 70, portrait: "street-gang-leader.png",
      text: "Work outside the law long enough and you either get caught by the authorities or rise to a position of power. The city's various street gangs elevate from within, choosing their cleverest, wisest, or cruelest to take on the mantle of leadership.",
      attacks: [["Armor-Piercing Pistol", "75%; 45 physical damage; add 1 advantage die ([advantage]) to rolls made to attack automatons or vehicles"], ["Threats", "65%; 50 mental damage"], anything(20)],
      perks: [["Let 'Em Have It", "Add 10 to the physical damage dealt by any successful attack made by a squad of Street Gang minions."]],
    },
    {
      name: "Violent Anarchist", type: "Antagonist", luck: 70, portrait: "violent-anarchist.png",
      text: "The call to resistance is frequently answered by people who just want to watch the world burn down around them. Whether due to mental instability or simply a hatred of the world that has seeped into their very core, these anarchists will spread violence across the city indiscriminately in the name of overturning the system.",
      attacks: [["Jagged Club", "75%; 50 physical damage"], anything(20)],
      perks: [["Zeal", "Add 1 challenge die ([challenge]) to non-physical attack rolls made to intimidate or frighten this character in some way."]],
    },
    {
      name: "Anarchist Firebrand", type: "Minor villain", luck: 220, portrait: "anarchist-firebrand.png",
      text: "Any upheaval moment needs its leaders, and among those who seek to foment chaos it is often the loudest and most charismatic voices that form the rallying cry. The leaders of violent anarchist movements know what words to use to stir reckless hate in the hearts of their followers and do so without regard to collateral damage.",
      attacks: [["Demagoguery", "90%; 35 mental damage"], ["Flechette Shotgun", "65%; 50 physical damage; add 1 advantage die ([advantage]) to rolls made to attack up-close targets and 1 challenge die ([challenge]) to rolls made to attack far away targets"], anything(25)],
      perks: [["Mob Mentality", "At the start of each of this character's turns, one Violent Anarchist that can see and hear this character regains 20 luck."], ["Zeal", "Add 2 challenge dice ([challenge][challenge]) to non-physical attack rolls made to intimidate or frighten this character in some way."]],
    },
    {
      name: "Chromed-Up Bruiser", type: "Antagonist", luck: 70, portrait: "chromed-up-bruiser.png",
      text: "The corporations aren't the only ones who can afford to augment their foot soldiers with cybernetics and genetic enhancements. Some of the most dangerous criminal enforcers are so heavily altered that they resemble walking tanks more than who they once were.",
      attacks: [["Fists and Feet", "75%; 45 physical damage"], anything(20)],
      perks: [BLOODTHIRSTY, ["Brawler", "This character can make a Fists and Feet attack against each of two different targets as a single action."], ["Chromed Up", "Add 1 advantage die ([advantage]) to any roll for a digital attack made against this character."]],
    },
    {
      name: "Assassin", type: "Minor villain", luck: 220, portrait: "assassin.png",
      text: "Though for many death is a temporary inconvenience, hired killers still do a robust trade. Assassins are an indispensable tool used by gangs and corporations alike, and many play both sides as long as the money is right.",
      attacks: [["Silenced Assault Rifle", "90%; 35 physical damage"], ["Plasma Blade", "65%; 50 physical damage; deals 2 wounds when hitting a target with 0 luck"], anything(25)],
      perks: [ODDS, brutal(2), hidden(10)],
    },
    {
      name: "Rival Gang Member", type: "Minor villain", luck: 220, portrait: "rival-gang-member.png",
      text: "Among the criminals that don't abide by the Arrangement, there are those who possess skill sets similar to those possessed by members of the crew. They are the dark mirror to the Right Kind of People, grifters and masterminds and operators (among others) who take what they want and don't care who gets hurt.",
      attacks: [["Hacking", "90%; 30 digital damage"], ["Compact Pistol", "65%; 50 physical damage"], ["Run a Con", "65%; 50 mental damage"], anything(25)],
      perks: [WRONG_KIND],
    },
    {
      name: "Brutish Lieutenant", type: "Minor villain", luck: 220, portrait: "brutish-lieutenant.png",
      text: "Every organization with any power has within its ranks some members whose job is to be tough and to follow orders. From corporations to crime syndicates, these groups have brutes on staff who act as the right-hand muscle to their more cerebral leaders.",
      attacks: [["Fists and Feet", "90%; 35 physical damage"], ["Machine Pistol", "65%; 50 physical damage"], anything(25)],
      perks: [ODDS, ["The Hard Way", "This character can make a Fists and Feet attack and a Machine Pistol attack as a single action. Each attack must be against a different target."]],
    },
    {
      name: "Cartel Underboss", type: "Minor villain", luck: 220, portrait: "cartel-underboss.png",
      text: "Since groups of affiliated gangs have influence in districts across the city, their leaders lean on individuals who show the ability to get things done and keep a level head to control the gangs at street level. These underbosses are usually tough, but pragmatic, former foot soldiers who aren't afraid to get their hands dirty.",
      attacks: [["Threats", "90%; 35 mental damage"], ["Jagged Knife", "65%; 55 physical damage"], anything(25)],
      perks: [["My People Are Everywhere", `The Administrator can spend 5 heat (${"[heat]".repeat(5)}) to add a squad of Street Gang minions (of a size equal to the number of crew members in the scene x2) at any time, revealing them from among background characters that are inconsequential to the scene.`], ["Unflappable", "This character halves any damage they would take from mental attacks."]],
    },
    {
      name: "Crime Lord", type: "Major villain", luck: 500, portrait: "crime-lord.png",
      text: "Power consolidates to protect itself, and this is especially true in the cutthroat world outside of the law. Standing apart from the Right Kind of People, criminal cartels that are more indiscriminate in who they target operate under the direction of these crime lords.",
      attacks: [["Intimidation", "90%; 55 mental damage"], ["Bare Hands", "65%; 75 physical damage"], anything(30)],
      perks: [ODDS, ["Right-Hand Help", "If the Administrator spends heat to add this character to a scene, add a Cartel Underboss to the scene as well without spending additional heat."]],
    },
    {
      name: "Soldiers", type: "Minion squad", portrait: "soldiers.png",
      text: "Both government-run armed forces and private military contractors employ battalions of soldiers trained to kill, destroy, and capture. Unlike private security teams, soldier squads have the training and discipline to execute complex plans of action with minimal collateral damage or risk of things going off the rails.",
      attacks: [["Assault Rifle", "65%; physical damage equal to the squad's size x10"]],
      perks: [COLLECTIVE],
    },
    {
      name: "Covert Ops Agent", type: "Antagonist", luck: 70, portrait: "covert-ops-agent.png",
      text: "When a battle plan requires secrecy and speed, their leaders tap the Covert Ops teams trained specifically for stealth. Both extremely lethal and capable of advanced tactical decision-making, covert agents can go in, execute mission parameters, and be out before anyone even knows that they were there.",
      attacks: [["Silenced Assault Rifle", "75%; 45 physical damage"], anything(20)],
      perks: [["Team Tactics", "When the Administrator spends heat to add this character to a scene, for each additional 2 heat ([heat][heat]) the Administrator spends, add 1 more of this character to the scene."], UNEXPECTED],
    },
    {
      name: "Sniper", type: "Antagonist", luck: 70, portrait: "sniper.png",
      text: "Both military units and private security teams value the skills of specialist marksmen. Especially in urban environments, the ability to take down a target in the middle of a crowd or hidden behind cover is essential to putting down uprisings efficiently.",
      attacks: [["Rail Sniper Rifle", "65%; 30 physical damage; add 1 advantage die ([advantage]) to rolls made to attack far away targets and 1 challenge die ([challenge]) to rolls made to attack up-close targets"], anything(20)],
      perks: [["Lethal Precision", "When this character causes a target to take a wound with a physical ranged attack, the target instead takes 2 wounds."]],
    },
    {
      name: "TacSquad Unit", type: "Minor villain", luck: 250, portrait: "tacsquad-unit.png",
      text: "Most private security companies have at least a few tactical squads, units composed of synthetics or humans in total cybernetic conversion shells. TacSquad members are walking tanks, hulking, robotic warriors brought in by dropships when heavy firepower is the only solution.",
      attacks: [["Chain Gun", "90%; 35 physical damage"], ["Tactical Missiles", "65%; 50 physical damage (area attack)"], anything(25)],
      perks: [brutal(1), SYNTHETIC, ["War Machine", "This character can make a Chain Gun attack against each of two different targets as a single action."]],
    },
    {
      name: "Senior Officer", type: "Minor villain", luck: 220, portrait: "senior-officer.png",
      text: "Senior officers frequently command from makeshift bases of operations near the site where an operation will go down. Most senior officers have augmentations aimed at improving their tactical evaluation skills and their ability to coordinate complex unit movements mid-op.",
      attacks: [["Command Authority", "90%; 35 mental damage"], ["Sidearm", "65%; 55 physical damage"], anything(25)],
      perks: [["Chain of Command", "If Soldier minions are defending this character in the scene, add 2 challenge dice ([challenge][challenge]) to rolls made for physical attacks against this character."], summon("Field Commander", "Soldier")],
    },
    {
      // The book prints "Antagonist | 450 luck", though its 450 luck is a major villain's.
      name: "Military Commander", type: "Antagonist", luck: 450, portrait: "military-commander.png",
      text: "Though rarely seen in the city, the commanders who oversee entire private military contractors or official government armed forces are closer to being executives than the soldiers they command. They set the larger strategy for the battalions they oversee, a strategy usually focused on maintaining the status quo.",
      attacks: [["Command Authority", "90%; 55 mental damage"], anything(30)],
      perks: [ODDS, ["Battlefield Command", "As this character's action, they can issue commands to another enemy or squad of minions loyal to this character, allowing the chosen enemy or minion squad to move and make a physical attack immediately, adding 2 advantage dice ([advantage][advantage]) to their rolls."]],
    },
    {
      name: "Bounty Hunter", type: "Antagonist", luck: 70, portrait: "bounty-hunter.png",
      text: "When criminals achieve a certain amount of notoriety, the corporations often turn to extrajudicial methods for taking them out, posting prices on their heads that professional bounty hunters are all too happy to collect.",
      attacks: [["Automatic Pistol", "75%; 45 physical damage"], ["Concussive Shock Shotgun", "65%; 50 physical damage; renders a target unconscious if it reduces them to 0 luck; push the target away from this character one distance step"], anything(20)],
      perks: [hidden(5), ["Relentless", "This character does not add challenge dice to rolls as a result of the **Wounded** condition."]],
    },
    {
      name: "Malevolent Synthetic", type: "Minor villain", luck: 220, portrait: "malevolent-synthetic.png",
      text: "While most synthetic intelligences attempt to join human society, some violently reject such integration, whether because they believe synthetic intelligence to be superior to humans or out of a desire for vengeance for mistreatment at the hands of their biological creators.",
      attacks: [["Machine Strength", "90%; 35 physical damage"], ["Computer Virus", "65%; 50 digital damage"], anything(25)],
      perks: [hidden(5, "a synthetic minor, background character"), SYNTHETIC],
    },
    {
      name: "Genespliced Beast", type: "Antagonist", luck: 70, portrait: "genespliced-beast.png",
      text: "Though their creation and use is certainly unethical, many executives keep genetically-altered and cybernetically-augmented animals as personal guards and companions, putting them on display to intimidate with their savagery and impress with their cost.",
      attacks: [["Claws and Teeth", "75%; 45 physical damage"], anything(20)],
      perks: [["Beast Intelligence", "Add 1 challenge die ([challenge]) to rolls made for mental attacks against this character."], brutal(1)],
    },
    {
      name: "Giant Robot", type: "Minor villain", luck: 250, portrait: "giant-robot.png",
      text: "Though there are many legitimate uses for larger-than-human robots, from construction to mining and beyond, hulking robots are a favorite tool to be used for everything from security to disposable hit squads.",
      attacks: [["Machine Strength", "90%; 35 physical damage"], anything(25)],
      perks: [["Automaton", "This character is immune to mental attacks."], ["Brawler", "This character can make a Fists and Feet attack against each of two different targets as a single action."], ["Large", "This character is the size of a small vehicle and attacks made by, and made against, this character are modified accordingly."], SYNTHETIC],
    },
    {
      name: "Private Investigator", type: "Minor villain", luck: 220, portrait: "private-investigator.png",
      text: "The bane of highly-skilled criminals, private investigators are wise to the tricks of the criminal trade and use that knowledge to foil crews' plans. These investigators are often hired by executives, private security companies, and even the city's police force on a contract basis to uncover criminal plots before they can come to fruition.",
      attacks: [["Get to the Truth", "90%; 35 mental damage"], ["Sidearm", "65%; 50 physical damage"], anything(25)],
      perks: [["Shielded Cybernetics", "This character is immune to digital attacks while outside of the Network unless the attacker has direct data access via a hardline connection to this character's cybernetics."], SKEPTIC],
    },
    {
      name: "Psionic Mesmerist", type: "Minor villain", luck: 220, portrait: "psionic-mesmerist.png",
      text: "While many in the city who have experienced a psionic awakening are troubled by their powers, some are able to quickly master their talents and turn them to personal gain. Especially dangerous are those with telepathic abilities that let them read the thoughts of others and project visions of what they want their victims to see right into their brains, fooling eyes and swarms alike.",
      attacks: [["Cause Hallucinations", "90%; 35 mental damage"], ["Mind Spike", "65%; 50 physical damage"], anything(25)],
      perks: [["Mind Virus", "When this character hits a target with Cause Hallucinations or Mind Spike, they may repeat the attack again against a different target. No character can be targeted more than once in a round by attacks granted by this perk."]],
    },
    {
      name: "Veteran Mercenary", type: "Antagonist", luck: 50, portrait: "veteran-mercenary.png",
      text: "Some of those with combat training chafe at the restrictions placed on them by the rigid command structure used by military organizations. These soldiers of fortune sell their services to the highest bidder, bringing all of the tactical skill and none of the accountability to any operation.",
      attacks: [["Assault Rifle", "75%; 45 physical damage"], anything(20)],
      perks: [BRIBE],
    },
    {
      name: "Secret Police Agent", type: "Minor villain", luck: 220, portrait: "secret-police-agent.png",
      text: "Their existence officially denied by the city government, the secret police are a covert branch of the city's police force whose role is to intimidate and silence anyone that dares to speak out against the corporations. One part spy, one part jackbooted thug, secret police agents terrorize citizens and make anyone with revolutionary tendencies disappear in the dead of the night.",
      attacks: [["Interrogate", "90%; 35 mental damage"], ["Hand Cannon", "65%; 50 physical damage"], ["Hacking", "65%; 50 digital damage"], anything(25)],
      perks: [hidden(10), ["Psionic Baffling", "This character is immune to mental attacks made using psionic augmentations."]],
    },
    {
      name: "Police Officers", type: "Minion squad", portrait: "police-officers.png",
      text: "Often overshadowed by the more ubiquitous private security companies, the city maintains a police force that is ostensibly the ultimate peacekeeping authority. Often underpaid compared to their private security comrades, city police officers seem split between the last of the idealists in government and those who just want to use their authority to abuse people that they don't like.",
      attacks: [["Sidearms", "50%; physical damage equal to the squad's size x5"], SQUAD_ELSE],
      perks: [COLLECTIVE, ["Threat Response", `Add 5 heat (${"[heat]".repeat(5)}) to the heat pool the first time this squad is targeted with a physical attack during a scene.`]],
    },
    {
      name: "Militant Citizen", type: "Antagonist", luck: 70, portrait: "militant-citizen.png",
      text: "Though they profess to be fighters on the side of the average people, these armed and dangerous citizens manage the cognitive dissonance necessary to loudly proclaim their demands for personal freedom while fighting on the side of the oppressors to keep anyone from threatening the natural order of executive oligarchy.",
      attacks: [["Assault Rifle", "75%; 45 physical damage"], anything(20)],
      perks: [BLOODTHIRSTY, ["Trigger Happy", "After a non-physical attack against this character misses, this character immediately makes one physical attack."], WRONG_KIND],
    },

    // Threats in the Network
    {
      name: "Monitor Processes", type: "Minion squad", network: true,
      text: "Simple programs that look for anomalies within the node they inhabit, monitor processes are usually represented as something nosy but unobtrusive, like a flock of birds, a group of squirrels, floating eyeballs, etc.",
      attacks: [["Look for Trouble", "60%; mental damage equal to the squad's size x5"], anything(20)],
      perks: [["Automaton", "This squad of minions is immune to mental attacks."], COLLECTIVE],
    },
    {
      name: "Tech Squad", type: "Minion squad", network: true,
      text: "The lowest-level sentient security presence in most nodes comes in the form of tech squads, groups of low-paid tech workers who perform routine protection and upkeep tasks. These squads usually wear nondescript avatars intended to blend into the node's aesthetic unseen, like peasants, janitorial staffs, or utility workers.",
      attacks: [["Purge", "60%; digital damage equal to the squad's size x5"], anything(20)],
      perks: [COLLECTIVE],
    },
    {
      name: "Virus Scanners", type: "Minion squad", network: true,
      text: "More active programs that seek out malicious presences and isolate them so they can do no more damage, virus scanners often appear as guard dogs, security personnel, or sentinels of some kind.",
      attacks: [["Quarantine", "60%; digital damage equal to the squad's size x5"], anything(20)],
      perks: [["Automaton", "This squad of minions is immune to mental attacks."], COLLECTIVE],
    },
    {
      name: "Daemon", type: "Antagonist", luck: 50, network: true,
      text: "Responsible for maintaining automated, but more complex, tasks, daemons are specialized programs that run in the background without sentient intervention. They are often represented as specialist workers, like electricians, masons, mechanics, etc.",
      attacks: [["Kill Process", "75%; 45 digital damage"], anything(20)],
      perks: [["Automaton", "This antagonist is immune to mental attacks."], ["Forked Process", "If the Administrator spends heat to add this automaton to a scene, add another one of this automaton without spending additional heat."]],
    },
    {
      name: "Security Agent", type: "Antagonist", luck: 50, network: true,
      text: "Highly-capable artificial intelligences trained on vast reams of historical data on cyberterrorism and hacking of all kinds, these programs are often represented as soldiers, elite warriors, and other heavily-armed combatants looking to find invading programs and avatars and purge them from the node.",
      attacks: [["Purge", "75%; 45 digital damage"], ["Interrogate", "65%; 50 mental damage"], anything(20)],
      perks: [["Automaton", "This antagonist is immune to mental attacks."], ["Multitasker", "This character can make a Purge attack against each of two different targets as a single action."]],
    },
    {
      name: "System Admin", type: "Minor villain", luck: 200, network: true,
      text: "Most corporate nodes on the Network have a dedicated sentient system administrator on-duty at any given time, overseeing the node's operation and entering the Network virtually to spot-check the work being done by autonomous programs.",
      attacks: [["Revoke Permissions", "90%; 35 digital damage and the target gains the **Restricted** negative condition"], ["Force Fragmentation", "65%; 50 digital damage"], anything(25)],
      perks: [summon("Software Guru", "Virus Scanner")],
    },
    {
      name: "Node Architect", type: "Major villain", luck: 450, network: true,
      text: "Half artist, half programmer, node architects are responsible for creating the three-dimensional user interface of a Network node. This combination allows them to bend the reality of a node at-will, making them dangerous opposition.",
      attacks: [["Overwrite Code", "90%; 55 digital damage"], anything(30)],
      perks: [["Edit Configs", `Any time the node architect hits with a digital attack, choose one of the following additional effects:
- The target is pushed to be far away from the node architect or pulled to be up close
- A barrier appears between the target and the node architect
- Gravity is inverted for the target for the rest of the scene
- The target drops through the floor to a room below`]],
    },
    {
      name: "InfoSec Lead", type: "Major villain", luck: 450, network: true,
      text: "Hands-on executives who take operational and information security seriously, InfoSec leads are the equivalent of private investigators or bounty hunters. They focus on counter-cyberterrorism, maintaining secrecy, and ensuring that anyone who is foolish enough to tamper with a node they are responsible for comes to regret it.",
      attacks: [["Interrogate", "90%; 55 mental damage"], anything(30)],
      perks: [SKEPTIC, summon("Systems Director", "Tech Squad")],
    },
    {
      name: "Chaos Crew", type: "Minion squad", network: true,
      text: "Mischief makers, script kiddies, and literal children who are accessing the Network through haptics, these roving gangs of pseudo-hackers love to cause chaos by cosmetically vandalizing Network nodes and generally causing a disturbance.",
      attacks: [["Make Mischief", "60%; digital damage equal to the squad's size x5"], anything(20)],
      perks: [COLLECTIVE, ["Distraction", "All non-automaton avatars up close to this squad have the **Distracted** negative condition."]],
    },
    {
      name: "Hostile Synthetic", type: "Minor villain", luck: 200, network: true,
      text: "Many synthetic intelligences are more at home when traversing the Network than they are in the physical world, and they often see it as their territory to guard. Running afoul of a hostile synthetic intelligence in a Network node puts human users at a distinct disadvantage, fighting an enemy on their home turf.",
      attacks: [["Data Mangling", "65%; 50 digital damage"], anything(25)],
      perks: [ODDS, ["Malevolent Interface", "When this character reduces a target to 0 luck or hits a target with 0 luck with a digital attack, if that target is an avatar their user in the physical world also takes 1 wound."]],
    },
    {
      name: "Virus", type: "Antagonist", luck: 50, network: true,
      text: "Some viruses are specifically engineered to manifest as avatars in the Network, causing damage in any node they infect. Viruses often appear as something destructive (and, depending on the hacker that programmed it, edgy), like a swarm of locusts, a berserker warrior, or a zombie.",
      attacks: [["Corrupt Data", "75%; 45 digital damage and the target gains the **Virus Infected** negative condition"], anything(20)],
      perks: [["Automaton", "This antagonist is immune to mental attacks."], ["Infect Systems", "When this automaton hits a target that has the **Virus Infected x4** condition with a digital attack, that character is removed from the scene (sentient users are disconnected from the node harmlessly) and the Administrator adds a new copy of this character to the scene. The new copy has all of its starting luck and visually resembles the target that was removed by the digital attack."]],
    },
    {
      name: "Corrupted Ghost", type: "Antagonist", luck: 50, network: true,
      text: "From time to time, a non-sentient artificial intelligence uses a human's ghost as a data source, merging with it in a bid to achieve sentience. The most common result is a disturbing amalgamation of a human avatar and a corrupted artificial intelligence, something that often manifests as a glitchy, tormented monster.",
      attacks: [["Corrupt Data", "75%; 45 digital damage"], ["Disturbing Appearance", "65%; 50 mental damage"], anything(20)],
      perks: [["Automaton", "This antagonist is immune to mental attacks."], ["Glitch", "Each time this automaton takes damage, it moves and makes a Disturbing Appearance attack immediately."]],
    },
    {
      name: "Phisher", type: "Antagonist", luck: 50, network: true,
      text: "Social engineering is still a big part of hacking in the Network, and phishers are hackers who combine digital attacks with lies, deception, and impersonation. They often craft avatars that appear to belong to someone else, impersonating someone's digital persona to gain the trust of another user before using that trust to steal from their victim or sabotage a node.",
      attacks: [["Trickery", "75%; 45 mental damage"], ["Siphon Data", "65%; 50 digital damage"], anything(20)],
      perks: [["Impersonate Avatar", "When this avatar is up close to another avatar, the phisher can choose to take on the appearance of that other avatar. Digital attacks against the phisher that miss are rolled again immediately, targeting the impersonated avatar."], UNEXPECTED],
    },
    {
      name: "Cyberterrorist", type: "Major villain", luck: 450, network: true,
      text: "A label too-generously applied by the corporations, a true cyberterrorist is a hacker who causes destruction in the Network that has repercussions in the physical world. They target nodes belonging to financial institutions, government entities, and private security corporations, and execute reckless cyberattacks that frequently catch citizens in the node as collateral damage.",
      attacks: [["Force Systems Crash", "90%; 55 digital damage"], ["Indiscriminate Code Bomb", "65%; 75 digital damage; roll this attack against all targets up close to the first target"], anything(30)],
      perks: [ODDS, ["Denial of Service", "When this character hits a target with Force Systems Crash, they may repeat the attack again against a different target. No avatar can be targeted more than once in a round by attacks granted by this perk."], ["Malevolent Interface", "When this character reduces a target to 0 luck or hits a target with 0 luck with a digital attack, if that target is an avatar its user also takes 1 wound."]],
    },
    {
      name: "Tracer", type: "Antagonist", luck: 100, network: true,
      text: "The Network equivalent of bounty hunters, these node-hopping seekers take on contracts from corporations and crime lords alike. Their goal isn't to hunt people down and kick them out of the Network; it is to trap an avatar and trace their connection back to its source in the physical world, sending that location to their employer.",
      attacks: [["Trace to Source", "75%; 45 digital damage"], anything(20)],
      perks: [hidden(5)],
    },
    {
      name: "Rival Hacker", type: "Minor villain", luck: 200, network: true,
      text: "While many criminal hackers abide by the Arrangement, those who don't have no compunction about targeting crew members when they see an opportunity. Rival criminal hackers use all the same dirty tricks as a crew's hacker but cannot be trusted not to turn on their allies.",
      attacks: [["Force Fragmentation", "90%; 35 digital damage"], anything(25)],
      perks: [["Surge of Confidence", "When this character deals digital damage with an attack they also regain 20 luck."]],
    },
  ];

  root.NCD_ADVERSARIES = { TYPES, adversaries };
})(globalThis);
