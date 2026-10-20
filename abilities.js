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
  root.NCD_ABILITIES = [
    // ---- Assassin perks ----
    {
      id: "deadshot", type: "perk", name: "Deadshot", origin: null, archetype: "Assassin",
      description: `All ranged weapons have a minimum +30 bonus to damage for you.`,
    },
    {
      id: "distill-poison", type: "perk", name: "Distill Poison", origin: null, archetype: "Assassin",
      description: `You can use a montage action to create up to three doses of a poison, virus, or other harmful chemical that you describe to the Administrator. The poison must be something that affects the physical, mental, or emotional state of a living thing through biological means. You must describe the end result of the use of the poison, the delivery method (whether the poison is inhaled, ingested, absorbed by touch, or other means), and at least one dangerous aspect of its use. Any living being affected by the poison gains the **Poisoned x2** negative condition, which lasts until the end of the job; this counts as a negative condition for the affected individual, and a positive condition for anyone making rolls targeting them if the roll would be influence by the effects of the poison you described. The Administrator may describe additional mechanical effects for the poison, and may decide whether the effect you choose is setting-appropriate; if not, you may describe a different effect instead.`,
    },
    {
      id: "silent-takedown", type: "perk", name: "Silent Takedown", origin: null, archetype: "Assassin",
      description: `When you make a physical attack with a melee weapon, you can decide that neither you nor your target make any noise as a part of that attack. If your turn is before the target's, they cannot speak or take actions that make noise this turn. Witnesses not looking at you or your target do not witness the attack.`,
    },
    {
      id: "target-weak-spots", type: "perk", name: "Target Weak Spots", origin: null, archetype: "Assassin",
      description: `When you hit an enemy with a physical attack, that enemy adds 2 challenge dice ([challenge][challenge]) to its next attack roll made before the end of the next round.`,
    },
    {
      id: "weapon-master", type: "perk", name: "Weapon Master", origin: null, archetype: "Assassin",
      description: `All melee weapons have a minimum +30 bonus to damage for you.`,
    },

    // ---- Bruiser perks ----
    {
      id: "bodyguard", type: "perk", name: "Bodyguard", origin: null, archetype: "Bruiser",
      description: `When a physical attack would damage someone else that is up close to you, you can choose for that attack to hit you instead of the intended target. Halve the attack's damage before you take it.`,
    },
    {
      id: "brute-force", type: "perk", name: "Brute Force", origin: null, archetype: "Bruiser",
      description: `Do not add any challenge dice to physical melee attack rolls due to your target being larger than you. Additionally, whenever you succeed on a roll to Break or Destroy Something you can also make physical melee attack, rolling to Slash, Stab, or Strike Someone that is up close to the object you broke as a part of the same action. When you do, describe how you were able to carry through your momentum from breaking the object to smoothly flow into the attack and add 2 advantage dice ([advantage][advantage]) to the roll.`,
    },
    {
      id: "fierce-presence", type: "perk", name: "Fierce Presence", origin: null, archetype: "Bruiser",
      description: `When you roll less than a 25 on the percentile dice when making a check or mental attack to Goad Someone or Intimidate Someone, treat those dice as if you had rolled a 25.`,
    },
    {
      id: "sucker-punch", type: "perk", name: "Sucker Punch", origin: null, archetype: "Bruiser",
      description: `When you act during the first player segment of initiative, you gain a +10 bonus to the damage of any melee attack rolls you hit with.`,
    },
    {
      id: "the-usual-suspects", type: "perk", name: "The Usual Suspects", origin: null, archetype: "Bruiser",
      description: `You can use a montage action to reach out to your contacts among the Right Kind of People to help your crew for the remainder of the job. Make a roll to Gossip with Criminals:

- **Success:** Add a size 5 squad of minions to your crew. These minions stay with you until the end of the job.
- **Failure:** Add a size 5 squad of minions to your crew. These minions stay with you until the end of the following day.

You decide how the squad acts during any scene you wish them to be a part of. The squad has a 50% chance of success for anything requiring a roll, and it can fight, help with tasks, and deal with objectives and complications (though it must always work as a single unit). The squad acts on your turn during conflict scenes.

If you spend 1 Influence ([influence]) when you use this ability, you increase the size of the squad to 10 minions.`,
    },

    // ---- Doc perks ----
    {
      id: "bedside-manner", type: "perk", name: "Bedside Manner", origin: null, archetype: "Doc",
      description: `When any member of your crew overlays or removes a shell sheet, they regain all of their luck. Additionally, as a montage action, you can remove all wounds and restore all lost luck of one other crew member, performing healing, repairs, and basic maintenance on their behalf. You may also install a piece of gear with the cybernetic keyword in that crew member that they have in their possession but have not yet installed. You must have physical access to that crewmate to use this perk.`,
    },
    {
      id: "diagnose-malady", type: "perk", name: "Diagnose Malady", origin: null, archetype: "Doc",
      description: `In a scene in the physical world that you are in, you can designate one non-automaton Administrator-controlled character (human or synthetic) present and known to you as being afflicted by some injury or illness that would otherwise be too subtle for someone untrained to detect. Describe the malady affecting them, then apply the **Debilitated** negative condition to that character. You cannot use this perk again until the next day.`,
    },
    {
      id: "medical-alchemist", type: "perk", name: "Medical Alchemist", origin: null, archetype: "Doc",
      description: `Using a combination of chemistry, computer programming, and hardware enhancements, you can craft unique stimulants that target the bodies and hives of anyone who uses them, camograms that can affect both human and synthetic bodies. As a montage action, you create one dose of one of the following items of your choice, describing its delivery mechanism as well:

- **Focus Enhancer:** Cancel 1 drawback ([drawback]) on any roll you make until the end of the scene.
- **Painkiller:** Regain luck equal to one-half of your maximum luck.
- **Rush of Energy:** Until the end of the scene, after canceling boons and drawbacks on a roll, double the number of remaining boons.

As a part of this montage action, make a roll to Heal Someone. If you fail, using the stimulant also gives the user the **Not Feeling So Good** negative condition.

During a conflict scene, you can administer one of these camograms on your turn without using your action.`,
    },
    {
      id: "ripper", type: "perk", name: "Ripper", origin: null, archetype: "Doc",
      description: `As a montage action, you can install short-lifespan blackmarket cybernetic enhancements to temporarily enhance the capabilities of your crew. You choose one crew member and any one cybernetic body augmentation. Make a roll to Gossip with Criminals

- **Success:** You successfully install the cybernetics. The body currently occupied by the chosen crew member gains the augmentation you chose until the end of the job.
- **Failure:** As per the Success benefit, but the cybernetic hardware you acquire comes from less than reputable sources. The augmentation has the **Black Market Hardware** negative condition, which applies to any skill roll or attack that would be affected by that cybernetic augmentation. You can spend 1 influence ([influence]) to acquire cybernetics of a higher quality that do not impose a negative condition.`,
    },
    {
      id: "x-ware-upgrade", type: "perk", name: "X-Ware Upgrade", origin: null, archetype: "Doc",
      description: `As a montage action, you can fine-tune the physical enhancements the members of your crew make regular use of, applying bootleg firmware patches or engaging in some light gene therapy using a retrovirus of your own design. Choose one other crew member and make a roll to Heal Someone:

- **Success:** Everything goes smoothly. Choose three mental skills; that crew member gains 1 intrinsic advantage die ([advantage]) with each of those skills for the rest of the job.
- **Failure:** There are unforeseen side effects to your tinkering. Choose two mental skills; that crew member gains 1 intrinsic advantage die ([advantage]) with each of those skills for the rest of the job. Additionally, choose 2 physical skills; the body the crew member is currently occupying gains 1 intrinsic challenge die ([challenge]) with each of those skills for the rest of the job.`,
    },

    // ---- Gearhead perks ----
    {
      id: "black-market-mods", type: "perk", name: "Black Market Mods", origin: null, archetype: "Gearhead",
      description: `You can use a montage action to perform illegal aftermarket modifications to your crew's gear. Choose one of the following benefits:

- Add the **Overclocked x2** intrinsic positive condition to a piece of personal equipment
- Add 1 positive gear keyword to a piece of personal equipment
- Add 1 weapon keyword to a personal weapon

As a part of using this perk, make a roll to Fix or Modify Something. If you fail this roll, the Administrator chooses 1 negative gear keyword to add to the item you modified.

The item you modified with this perk retains these alterations until the end of the job.`,
    },
    {
      id: "break-it-forward", type: "perk", name: "Break It Forward", origin: null, archetype: "Gearhead",
      description: `During a scene you are in, you can choose 1 piece of gear, weapon, or vehicle to be something that has been sabotaged. You describe how, in the past, the object was something that you or one of your fellow crew members sabotaged. The target you choose for this ability must be a piece of gear that is non-unique and that could reasonably have been known to you. The object you choose gains the **Sabotaged x2** negative condition, which applies to anyone using that object. You cannot use this ability again until the next day.`,
    },
    {
      id: "demolitions-expert", type: "perk", name: "Demolitions Expert", origin: null, archetype: "Gearhead",
      description: `You automatically cancel up to 2 drawbacks ([drawback][drawback]) on any roll made to use a weapon with the explosive keyword.

Additionally, during a montage scene, you can transform one physical object into an explosive device. The object becomes a weapon with the explosive trait and a damage bonus of your choosing, ranging from +0 to +50. You determine the trigger for the weapon, the scale of the explosion (which can be no larger than a single floor of a building). When the weapon is triggered, the object is destroyed.

As a part of this montage action, make a roll to Fix or Modify Something. If you fail, you must also describe one risky aspect of the explosive device's use, and the device gains one negative gear keyword of the Administrator's choice.`,
    },
    {
      id: "fixer", type: "perk", name: "Fixer", origin: null, archetype: "Gearhead",
      description: `As a montage action, you can reach out to your contacts in the criminal underworld to get your hands on more specialized gear. Make a roll to Gossip with Criminals:

- **Success:** Gain a piece of specialized gear of your choice
- **Failure:** Gain a piece of specialized gear of your choice with a negative gear keyword chosen by the Administrator
- **Boons:** If you roll any boons on this roll, the piece of gear you acquire has 1 positive keyword of your choice`,
    },
    {
      id: "mechanic", type: "perk", name: "Mechanic", origin: null, archetype: "Gearhead",
      description: `As a montage action, you can make a Fix or Modify Something roll. On a success, gain all of the following benefits; on a failure, choose 1 benefit instead:

- Repair all broken items in your crew's possession
- Remove all Wounds from vehicles in your crew's possession
- Remove all Wounds from 1 synthetic crew member`,
    },

    // ---- Grifter perks ----
    {
      id: "assume-identity", type: "perk", name: "Assume Identity", origin: null, archetype: "Grifter",
      description: `As a montage action, you can create a different identity. Choose one of the following effects:

- You create an alias for use over multiple days, including proper identification for this persona (attempts to identify you by your ghost, save for a deep scan, will identify you as this person), as well as a digital footprint and social connections going back years. The identity must be one you create not someone who already exists.
- You create a disguise to be used later. During a scene that you are not a part of, you can choose one character that has already appeared in the scene and reveal that it was you in disguise all along, and join the scene (if you so choose, your "disguise" could involve loading into a temporary shell; overlay a Quick Shell sheet). The character you choose must be a minion or other, minor background character, and the Administrator must agree that they are not pivotal to the scene. When you enter a conflict scene in this way, you must do so at the start of the round and roll initiative for your character as normal, entering the scene when your turn begins.`,
    },
    {
      id: "i-know-somebody", type: "perk", name: "I Know Somebody", origin: null, archetype: "Grifter",
      description: `As a montage action, you can reach out to one of your contacts among the Right Kind of People for their assistance. Create a character using a Quick Shell sheet or Quick Avatar sheet to represent this contact; the character has 100 luck, acts on your turn in conflict scenes, and, for all mental skills, the character has a 50% chance of success.

Alternatively, you can add 4 heat to the heat pool ([heat][heat][heat][heat]) to have the character be a copy of your mind, loaded into a temporary shell. You use your mental skills' chance of success for this character, and apply any intrinsic advantage or challenge dice that you have on physical skills. That character can also use any character perks you have that can be used during a scene.`,
    },
    {
      id: "leverage", type: "perk", name: "Leverage", origin: null, archetype: "Grifter",
      description: `As a montage action, you can choose one Administrator-controlled character who you have interacted with socially (either in the physical world, or on the Network) and attempt to root out their dark secrets, using clues gained from your interaction with them to figure out where to start digging. Make a roll to Size Someone Up:

- **Success:** You learn a Deep Secret associated with that character, if one exists. If no Deep Secret exists, you instead learn their greatest desire, ambition, or the thing they care about the most.
- **Failure:** You gain the benefit described in the Success entry above, but something tips the person off that you are looking into them; add 2 heat ([heat][heat]) to the heat pool.`,
    },
    {
      id: "on-the-take", type: "perk", name: "On the Take", origin: null, archetype: "Grifter",
      description: `During any scene you are in, you can choose 1 Administrator-controlled character to be someone you have bribed or have leverage over. You describe how, in the past, that person became beholden to you. The character must be a non-automaton minion or other background character not pivotal to the scene and must be a law-abiding citizen who is not an executive.

Make a roll to Gossip with Citizens:

- **Success:** The character performs a minor task for you that you describe (unlocks a door, points out an undercover security officer, ignores a crime being witnessed, or progresses an objective with an equivalent of 50 impact) and you explain how this was prearranged. The character then exits the scene; they take no risks to their safety or freedom.
- **Failure:** The character performs a task for you as described in the Success entry above, but they are reluctant to do so. Spend 1 influence ([influence]) and describe the extra bribe or coercion you use to convince them, or, if you cannot or are unwilling to spend that influence, add 2 heat ([heat][heat]) to the heat pool as their reluctant help draws attention.

You cannot use this ability again until the next day.`,
    },
    {
      id: "silver-tongue", type: "perk", name: "Silver Tongue", origin: null, archetype: "Grifter",
      description: `When you roll less than a 25 on the percentile dice when making a check or mental attack to Convince Someone or Lie to Someone, treat those dice as if you had rolled a 25.`,
    },

    // ---- Hacker perks ----
    {
      id: "digital-saboteur", type: "perk", name: "Digital Saboteur", origin: null, archetype: "Hacker",
      description: `In a scene you are in, you can designate one automaton enemy (a drone, a program, etc.) present in the scene and known to you as having been infected with a virus you created. Describe the events that resulted in you infecting the target with a virus in the past, and then apply the **Virus-Infected x2** negative condition to that automaton. You cannot use this perk again until the next day.`,
    },
    {
      id: "enhanced-avatars", type: "perk", name: "Enhanced Avatars", origin: null, archetype: "Hacker",
      description: `As a montage action, you can create a unique avatar for yourself or a member of your crew. Take a Quick Avatar overlay sheet, choose 2 different skills and mark 2 intrinsic advantage dice ([advantage][advantage]) for those skills. Then, choose 2 other different skills and mark 1 intrinsic advantage die ([advantage]) for those skills. These intrinsic advantage dice represent software upgrades you have installed for that avatar. Then choose one of the options under Installed Software and mark the box next to it. You may either keep this avatar for yourself, or give it to another character to use, for the rest of the job. If you choose to keep it yourself, mark a second box under Installed Software. If you have used this augmentation on a previous job, you can re-use avatars you previously created as-is.`,
    },
    {
      id: "scripting-savant", type: "perk", name: "Scripting Savant", origin: null, archetype: "Hacker",
      description: `As a montage action, you can write a simple program that gives you (or a crewmate you give the program to) an edge during scenes in the Network. Choose one of these options to create:

- **Attack Script:** You create a program that acts like a weapon, enhancing and supplementing digital attacks. During scenes in the Network, this script adds +20 to the damage of digital attacks.
- **Utility Script:** You create a program that automates complex or tedious tasks, reducing the chances of error. During scenes in the Network, this script adds +20 to the impact of any roll made to progress an objective.

During the scene, you can describe how your attack script manifests, which should match the aesthetic of the node's user interface.`,
    },
    {
      id: "untraceable", type: "perk", name: "Untraceable", origin: null, archetype: "Hacker",
      description: `You know how to disguise your actions on the Network such that they are less likely to raise any suspicions. You do not add any heat to the heat pool for creating a legwork scene that takes place inside the Network.`,
    },
    {
      id: "virus", type: "perk", name: "Virus", origin: null, archetype: "Hacker",
      description: `As a montage action, you can create a semi-autonomous computer virus that, once unleashed, will continue to attempt to infest systems and wreak havoc on them. You describe what kinds of systems it can affect (for example, your virus could target only the security cameras at a restricted location, robot sentries, or automaton defenses in a Network node), what cosmetic effect it creates upon infecting a system, and at least one aspect of its programming that could cause unpredictable results. During any subsequent scene you are in, you can unleash the virus into the targeted system (which you will need to have reasonable access to); doing so requires your action in a conflict scene. The virus joins the scene, using the stat block below, and acts on your turn as you direct for the rest of the scene.

**HACKER'S VIRUS**
*Antagonist | 50 Luck*

**Skills and Attacks**
Crash a System: 65% · Anything Else: 50%

**Perks**
- **Automaton:** This character is immune to mental attacks.
- **Digital-Only:** This character has no physical presence and is immune to physical attacks. In scenes in the physical world, it can only make digital attacks and progress objectives, and can only attack targets whose systems it can reach through data connections (wired or wireless).
- **Self-Replicating:** When this character defeats an enemy or completes an objective, it regains all of its lost luck and can immediately transmit itself to another system in the scene.`,
    },

    // ---- Mastermind perks ----
    {
      id: "all-part-of-the-plan", type: "perk", name: "All Part of the Plan", origin: null, archetype: "Mastermind",
      description: `You can use a montage action to set up a flashback. Once before the end of the job, at any time you can ask for a pause in the action to create a flashback to what your crew did in preparation for this scene. You, or another member of the crew you designate, can then join the scene immediately (in a place and by a means that the Administrator agrees is plausible) if not already present, then gain the benefits of a montage action, describing it as something that could have been done during the previous day that has an impact on the current scene. This action cannot be used to Blow Off Steam or Coordinate With Allies.

Alternatively, if you create this flashback during the job's final scene, the benefit you gain can be the equivalent something you would get out of a legwork scene, provided the Administrator agrees that it is plausible.`,
    },
    {
      id: "contingency-plan", type: "perk", name: "Contingency Plan", origin: null, archetype: "Mastermind",
      description: `As a montage action, you can spend time planning for every possible eventuality, giving yourself a better chance to anticipate what may happen. Roll percentile dice twice and mark down each of the results. Until the end of the job, you can substitute each of those numbers once for any roll just made by any player, representing that you had the foresight to know what was going to happen.`,
    },
    {
      id: "coordinate", type: "perk", name: "Coordinate", origin: null, archetype: "Mastermind",
      description: `When a member of your crew helps another on a skill roll while you are in the scene and able to communicate with them, add 2 advantage dice ([advantage][advantage]) to the roll.`,
    },
    {
      id: "prep-work", type: "perk", name: "Prep Work", origin: null, archetype: "Mastermind",
      description: `As a montage action, you can help your crew prepare to make their next move. Choose one skill and describe how you help your crew prepare. Until the end of the job, all other members of your crew gain 2 advantage dice ([advantage][advantage]) on all rolls made with that skill.`,
    },
    {
      id: "supply-cache", type: "perk", name: "Supply Cache", origin: null, archetype: "Mastermind",
      description: `During a scene you are in that takes place in the physical world, you can access a cache of supplies that you had your agents among the Right Kind of People plant in advance. Make a roll to Throw Money at the problem:

- **Success:** Each member of the crew present in the scene can choose 1 piece of specialized equipment or common gear, or 1 set of consumable exceptional tools, or 1 weapon with 1 weapon keyword of their choice to be in the cache.
- **Failure:** You choose 1 piece of specialized equipment or common gear, or 1 set of consumable exceptional tools, or 1 weapon with 1 weapon keyword of your choice to be in the cache.`,
    },

    // ---- Merc perks ----
    {
      id: "combined-fire", type: "perk", name: "Combined Fire", origin: null, archetype: "Merc",
      description: `When you help another crew on a physical attack, or another member of the crew helps you on a physical attack, add 1 advantage die ([advantage]) to the roll for each person helping instead of 1 challenge die ([challenge]).`,
    },
    {
      id: "forever-lucky", type: "perk", name: "Forever Lucky", origin: null, archetype: "Merc",
      description: `When you roll any number of advantage dice, if none of the dice show a boon ([boon]) symbol, change 1 die to show a boon symbol`,
    },
    {
      id: "i-can-do-that", type: "perk", name: "I Can Do That", origin: null, archetype: "Merc",
      description: `Whenever you make a roll for Anything Else, roll your percentile dice twice and take either result. You cannot use this perk again this scene.`,
    },
    {
      id: "problem-solver", type: "perk", name: "Problem Solver", origin: null, archetype: "Merc",
      description: `You add 2 advantage dice ([advantage][advantage]) to any roll you make to progress an objective.`,
    },
    {
      id: "second-chance", type: "perk", name: "Second Chance", origin: null, archetype: "Merc",
      description: `Once per scene you are in, you can re-roll all the dice (including all advantage dice and challenge dice) for a single check or attack, keeping the second result.`,
    },

    // ---- Operator perks ----
    {
      id: "create-drone", type: "perk", name: "Create Drone", origin: null, archetype: "Operator",
      description: `As a montage action, you can construct a small robotic drone that you can use for the remainder of the job. This drone has a form and method of locomotion (flight, rolling, walking, swimming, etc.) that you describe and is roughly the size of a briefcase. It can record and transmit visual and audio data and can be controlled via your HUD, acting as you direct and allowing you to perceive the world from its perspective; as a result, you can make rolls to Case the Joint as though you were in the drone's physical location. The drone is an antagonist with 50 luck, a 50% chance of success for Anything Else rolls, and is an Automaton. Choose one of the following options for the drone you create:

- **Combat Drone:** The drone has a mounted pistol with 1 weapon keyword of your choice. The drone has a 65% chance on rolls to Shoot Something.
- **Espionage Drone:** The drone has a 65% chance on rolls to Sneak Around. Additionally, the drone comes equipped with a computer interface arm, allowing it to plug into computer systems and giving you access to those systems via your HUD.
- **Utility Drone:** Choose two physical skills; the drone has a 65% chance of success on rolls for those two skills. The drone also has 1 piece of common gear built into it.

When you use this perk, make a roll to Fix or Modify Something. On a failure, the Administrator chooses one negative gear keyword to add to the drone.`,
    },
    {
      id: "lookout", type: "perk", name: "Lookout", origin: null, archetype: "Operator",
      description: `Whenever the Administrator spends heat ([heat]) to introduce a complication into the scene, you and all other members of your crew add 2 advantage dice ([advantage][advantage]) to any rolls you make to deal with or otherwise interact with that complication.`,
    },
    {
      id: "one-step-ahead", type: "perk", name: "One Step Ahead", origin: null, archetype: "Operator",
      description: `You add +30 to the impact of any skill check you make to progress an objective required to allow you or your crew to escape capture or exit a scene.`,
    },
    {
      id: "ram-em", type: "perk", name: "Ram 'Em!", origin: null, archetype: "Operator",
      description: `You add +30 to the damage of any physical attack roll you make to ram someone with a vehicle or drone you are controlling. Halve any damage a vehicle you are driving or piloting takes from being rammed by something else.`,
    },
    {
      id: "tinkerer", type: "perk", name: "Tinkerer", origin: null, archetype: "Operator",
      description: `During a montage scene, you can modify one vehicle or drone you have access to for the full duration of the scene. Choose one of the following benefits:

- **Mount Weapon:** Add a mounted weapon with one keyword of your choice to the drone or vehicle.
- **Overclock:** Add the **Overclocked x2** intrinsic positive condition to the drone or vehicle
- **Reinforce:** Add the **Armored** intrinsic condition to the drone or vehicle. This counts as a negative condition for anyone making physical attacks against this drone or vehicle.
- **Upgrade Weapon:** Add a weapon keyword to a weapon already mounted on the drone or vehicle.

The benefit you choose remains on the drone or vehicle until the end of the job. When you use this perk, make a roll to Fix or Modify Something. On a failure, the Administrator chooses one negative gear keyword to add to the drone or vehicle.`,
    },

    // ---- Thief perks ----
    {
      id: "hide-in-plain-sight", type: "perk", name: "Hide in Plain Sight", origin: null, archetype: "Thief",
      description: `When you are on a city street or in another public place with a crowd of people in the physical world, you can vanish into the crowd (in a conflict scene, this requires your action on your turn). You cannot be pursued or captured when you do, and you exit the scene (even if there is an objective in the scene that you would normally be required to complete before exiting).`,
    },
    {
      id: "multitasking", type: "perk", name: "Multitasking", origin: null, archetype: "Thief",
      description: `When you succeed on your initiative check, you can take an action in both player initiative segments. One of those actions must involve making a skill check to progress an objective. You may only move during one of the two crew member segments.`,
    },
    {
      id: "second-story-work", type: "perk", name: "Second Story Work", origin: null, archetype: "Thief",
      description: `You can find a way into any building in the city. During a scene in the physical world that you are in, you can enter any building without being seen or heard by way of any floor you choose, in a manner in which you describe, without having to roll any dice. When you enter the building, you arrive in one of the outermost rooms of the floor on which you entered, closest to the exterior walls of the building. Once you are inside the building, the Administrator may require you to make rolls to remain undetected. Additionally, when you use this perk, the Administrator may immediately spend 5 heat to introduce a minor complication of their choice.`,
    },
    {
      id: "security-expert", type: "perk", name: "Security Expert", origin: null, archetype: "Thief",
      description: `Once during each planning scene, you can choose one building, specific location, or Network node that you know of and could have plausibly seen before. The Administrator must tell you the location's security tier and describe to you all security measures (including standard security personnel, automated systems, restricted access, hacking countermeasures, and defensive weaponry) that are not considered Deep Secrets in place at that location. You may pause the planning scene timer during this description, resuming it once the Administrator has provided you with the relevant information.`,
    },
    {
      id: "you-mean-this", type: "perk", name: "You Mean This...?", origin: null, archetype: "Thief",
      description: `As a montage action, you can go out into the city and let your fingers do the walking through the pockets of easy marks and oblivious corporate drones. Once before the end of the job, at any time you can describe one simple inanimate object, which must be small enough that you could conceal it on your person, that you could have reasonably acquired during a pickpocketing spree in a public place. You produce that item and gain its use for the rest of the job. The item you produce cannot be unique, but it can be something not usually available to the public, such as a security guard's access badge.`,
    },

    // ---- Synthetic perks ----
    {
      id: "device-driver", type: "perk", name: "Device Driver", origin: "Synthetic", archetype: null,
      description: `You can use a montage action to load your mind into a Mass-Produced Synth shell or the Utility Robot shell without having to check either option under Shell Source.`,
    },
    {
      id: "installation-wizard", type: "perk", name: "Installation Wizard", origin: "Synthetic", archetype: null,
      description: `When you would overlay a Quick Avatar sheet that does not have any of its Pre-Installed Software boxes checked, you can check one box of your choice.`,
    },

    // ---- Cybernetic augmentations ----
    {
      id: "active-camouflage", type: "augmentation", name: "Active Camouflage", origin: "Cybernetic", archetype: "Assassin",
      summary: "Become invisible at-will",
      description: `You can become completely invisible; in a conflict scene, doing so requires your action. You become visible again if you move or take any actions. Any attempt to target or locate you visually while you are invisible fails.`,
    },
    {
      id: "kinetic-trajectory-calculator", type: "augmentation", name: "Kinetic Trajectory Calculator", origin: "Cybernetic", archetype: "Assassin",
      summary: "Automatically deal wounds with melee attacks",
      description: `When you hit with a physical attack, if you roll any boons ([boon]) on the attack you can forego dealing damage to instead automatically deal 1 wound to the target.`,
    },
    {
      id: "target-prioritization-package", type: "augmentation", name: "Target Prioritization Package", origin: "Cybernetic", archetype: "Assassin",
      summary: "Take an extra action to make a ranged attack",
      description: `When you succeed on your initiative check, you can take an action in both player initiative segments. One of those actions must involve making a ranged attack. You may only move during one of the two crew member segments.`,
    },
    {
      id: "fastreact", type: "augmentation", name: "FastReact", origin: "Cybernetic", archetype: "Bruiser",
      summary: "Always succeed on initiative",
      description: `You automatically succeed on initiative checks.`,
    },
    {
      id: "palmpulse-projectors", type: "augmentation", name: "PalmPulse Projectors", origin: "Cybernetic", archetype: "Bruiser",
      summary: "Project energy from your fists and feet",
      description: `Using electrical energy projectors installed in your palms and/or the soles of your feet, you can deliver an intense jolt of electricity whenever you strike someone. When you make a physical melee attack against someone without a weapon, you add +10 to the damage of the attack and, if the attack hits, the target gains the **Shocked** negative condition.`,
    },
    {
      id: "piston-servos", type: "augmentation", name: "Piston Servos", origin: "Cybernetic", archetype: "Bruiser",
      summary: "Round up the damage of melee damage to the nearest 10",
      description: `When you succeed on a roll to make a physical melee attack, round the percentile dice up to the nearest number divisible by 10 when determining the damage of the attack.`,
    },
    {
      id: "infravision", type: "augmentation", name: "Infravision", origin: "Cybernetic", archetype: "Doc",
      summary: "See thermal output",
      description: `You can switch your vision over to view the heat radiation by objects and individuals in the scene. You automatically cancel up to 2 drawbacks ([drawback][drawback]) on any roll where your attempt is hindered by darkness or other obscurement and your subject is something that radiates heat.`,
    },
    {
      id: "sixthsense-extrapolation-chip", type: "augmentation", name: "SixthSense Extrapolation Chip", origin: "Cybernetic", archetype: "Doc",
      summary: "Swap the digits of your crewmates' rolls to progress objectives",
      description: `You have a dedicated processor that connects to your senses and rapidly extrapolates the outcome of your companions' actions based on available data. When another member of your crew who you can see and communicate with makes a roll to progress an objective, after they make the roll but before it is resolved you can swap the digits on the percentile dice (thus, a 46 becomes a 64) as your extrapolation chip delivers a quick prediction that you communicate to your ally to adjust their approach. You cannot use this perk again in the same day.`,
    },
    {
      id: "weapon-mount", type: "augmentation", name: "Weapon Mount", origin: "Cybernetic", archetype: "Doc",
      summary: "Mount a weapon directly onto your body",
      description: `You have a weapon semi-permanently mounted onto your body by cybernetic attachments. Choose one weapon that is a piece of your starting gear that can have the Mounted keyword; this weapon must either be a one-handed weapon, or a two-handed weapon that has the Miniaturized keyword. The weapon gains the Mounted keyword, and you choose one additional keyword to add to it. You choose where the weapon is mounted on your body, typically arms or shoulders.`,
    },
    {
      id: "diagnostic-link", type: "augmentation", name: "Diagnostic Link", origin: "Cybernetic", archetype: "Gearhead",
      summary: "Gain information about computer systems and gear",
      description: `You have specialized hardware installed in your brain that allows you to access detailed diagnostic data from vehicles and objects. When you have an established link to a drone, computerized piece of equipment, or vehicle, you automatically know the following things about it:

- How much damage it has taken
- Which, if any, conditions are affecting it
- Who it is owned by
- Every place it has been in the last 24 hours
- Any information you would gain from having the correct Thing You Know About associated with it
- How to operate it

Additionally, you automatically add 2 advantage dice ([advantage][advantage]) to any roll you make to Break or Destroy Something, Drive or Pilot Something, Fix or Modify Something, or Infiltrate a System when the linked object is your target.`,
    },
    {
      id: "nanohacking-manufactory", type: "augmentation", name: "Nanohacking Manufactory", origin: "Cybernetic", archetype: "Gearhead",
      summary: "Create a destructive cell of nanomachines",
      description: `As a montage action, you can create a single use cloud of nanomachines programmed to perform a single act of physical alteration, creation, destruction, restructuring, or transformation. The function of the nanite cloud must involve the alteration of the physical or chemical properties of nonliving matter and may not directly affect biological functions or digital or electronic elements. You must describe the end result of the use of the cloud, how it is deployed, and name at least one aspect of its use dangerous to the user. When activated, if the nanite cloud will seek out suitable targets for alteration (if there are any in the same physical location where it is deployed) and autonomously execute their programming with no further input needed. If the nanite cloud is programmed to alter something that is part of a scene objective, or something that has luck, the nanite cloud deals the equivalent of 50 damage/50 impact (as appropriate to the target). The Administrator may rule that the nanite creation is not setting appropriate, and you can come up with a different idea if you so choose.`,
    },
    {
      id: "nanoprinting-cloud", type: "augmentation", name: "Nanoprinting Cloud", origin: "Cybernetic", archetype: "Gearhead",
      summary: "Print objects you need using a cloud of nanites",
      description: `As a montage action, you can acquire the raw materials necessary to nanoprint one object and a nanoprinting cloud capable of doing so. In any subsequent scene, you can nanoprint any one legally-obtainable object; during a conflict scene, this uses your action on your turn. The object you print must be something that can be carried by a single person without encumbering them, and must be an object that you could reasonably have encountered before. The object cannot have any biological component, must be a physical object, and cannot be a shell.`,
    },
    {
      id: "anonymizer-package", type: "augmentation", name: "Anonymizer Package", origin: "Cybernetic", archetype: "Grifter",
      summary: "Do not add heat for creating legwork scenes in the world",
      description: `You have a suite of technology combining dermal implants, subcutaneous radio broadcasters, and biometric scramblers that makes passive facial recognition, retinal capture, and biometric analysis software return only errors. This allows you to move freely about the city without being subjected to the omnipresent passive surveillance and data collection that law-abiding citizens have to endure. As a result, you do not generate heat for creating a legwork scene in the physical world.`,
    },
    {
      id: "mark-sensors", type: "augmentation", name: "Mark Sensors", origin: "Cybernetic", archetype: "Grifter",
      summary: "Swap the digits of your rolls for mental attacks",
      description: `You have a sensor suite that can specifically detect subtle changes in a human's posture, body language, body temperature, pulse, eye movements, muscle tension, and other tells not normally visible to the naked eye. Similarly, you can detect shifts in the energy patterns, motions, sensor projections, and other equivalent tells in synthetic bodies that provides you with a significant amount of information about a potential target. When you make a mental attack against someone who is up close to you, you can swap the digits on the percentile dice (for example, a 46 becomes a 64) before resolving the roll.`,
    },
    {
      id: "subcutaneous-hive", type: "augmentation", name: "Subcutaneous Hive", origin: "Cybernetic", archetype: "Grifter",
      summary: "A hive embedded in your body that cannot be tampered with",
      description: `Your hive is surgically embedded in your body and cannot be separated from you without surgical intervention. Your hive is also shielded from electromagnetic pulses and signal jamming, and data cannot be transferred to or from it without a hardwire connection via a jack embedded near the base of your head or through secure tactile networking. You cannot gain negative conditions that affect your hive unless they are from a hardwired connection.`,
    },
    {
      id: "familiar", type: "augmentation", name: "Familiar", origin: "Cybernetic", archetype: "Hacker",
      summary: "Gain an AI companion that performs simple tasks for you",
      description: `You have a sophisticated digital assistant, a piece of software so advanced that it appears to be almost sentient—almost. Your familiar takes on any form you like, with a faux-personality of your choosing, and it adapts itself to your needs and preferences. Your familiar can manifest itself in your field of view (tapping into your optic nerves to place itself in the world as augmented reality) and it communicates with you with either voice or text communications (your choice) that only you can perceive. During scenes taking place in the Network, your familiar can be present and interact with other avatars in the virtual world.

Whenever you create a legwork scene in the physical world, after that scene is completed your familiar can take 1 montage action of your choice. The task you describe must be one that the Administrator agrees that an advanced piece of administrative software would be capable of; communication and research are common tasks undertaken by familiars. Your familiar uses your skills' chances of success as its own if the action you wish it to take requires a skill check to succeed.

Familiars, advanced though they are, are still limited in their capacity for creative problem solving. Tasks that require intuition or creativity are beyond them, and they cannot make attacks of any kind. Furthermore, since familiars only exist in electronic form, they cannot directly interact with the physical world in any way. The Administrator determines whether or not the action you want the familiar to take is setting-appropriate.`,
    },
    {
      id: "firewall", type: "augmentation", name: "Firewall", origin: "Cybernetic", archetype: "Hacker",
      summary: "Protect yourself from digital attacks with temporary luck",
      description: `You have an internal firewall system that prevents other people from hacking your systems. You can use a montage action to configure a set of temporary defenses against digital attacks; Until the end of the job, you have a pool of 50 temporary luck that is depleted first whenever you are hit by a digital attack. When that temporary luck is depleted, attacks once again begin depleting your own luck. You retain this temporary luck when you overlay an avatar sheet, but if you load your mind into an entirely new shell this pool goes away. This temporary pool's luck cannot be restored or increased in any way.`,
    },
    {
      id: "lesser-program-memory", type: "augmentation", name: "Lesser Program Memory", origin: "Cybernetic", archetype: "Hacker",
      summary: "Take out more minions with digital attacks",
      description: `Hits with digital attacks against minions reduce the squad's size by 2 instead of by 1. Boons ([boon]) you roll on that attack reduce the squad's size by 1 more.`,
    },
    {
      id: "comms-hub", type: "augmentation", name: "Comms Hub", origin: "Cybernetic", archetype: "Mastermind",
      summary: "Coordinate your crew by routing their communications",
      description: `You have a communications array embedded in your body that connects to your hive and allows you to receive, sort, prioritize, and transmit sensory data and communications from your crew members in the most efficient manner possible. During a conflict scene, each round when the crew rolls for initiative, before the first turn is taken you can allow 1 crew member who failed their roll to swap their initiative rolls with a player who succeeded on a their initiative roll (provided that you are in communications with both of them). Additionally, you can use your action to allow 1 crew member you are in communication with to take an action immediately.`,
    },
    {
      id: "long-term-storage", type: "augmentation", name: "Long-Term Storage", origin: "Cybernetic", archetype: "Mastermind",
      summary: "Recall memories from deep storage to cancel drawbacks",
      description: `You have a memory bank linked to your hive that can store large amounts of sensory data, along with software that sifts through and compresses that data, giving you quick access to a large quantity of memories. Whenever you or any member of your crew makes a roll, you can quickly dig through your long-term storage, describing memories of something you did in the past (or even in a previous lifetime, if this is not your first shell) that could help in this situation. Cancel up to 2 drawbacks ([drawback][drawback]) on the roll. You can use this ability after any dice are rolled, including challenge dice added to a roll for pushing your luck.`,
    },
    {
      id: "ride-along-rig", type: "augmentation", name: "Ride-Along Rig", origin: "Cybernetic", archetype: "Mastermind",
      summary: "Stream sensory data from your crewmates",
      description: `You have a high-bandwidth secure broadcast receiver that allows you to stream sensory data from one of your fellow crew members in real time, allowing you to perceive everything that they do as though you were the one experiencing it. As a montage action, you can install the necessary broadcasting augmentations in one of your fellow crew members, where it remains until you use another montage action to move it to someone else, or until the job ends. During a scene that crew member is in, you can turn your ability to perceive what they are perceiving on and off at will, even if you are not currently participating in the scene. While the link is active, you can interact with that crew member in non-physical ways, such as helping them with skill checks or using perks that require you to be in the same scene as the crew member, provided the Administrator agrees that your action is feasible when acting from a remote location.`,
    },
    {
      id: "aim-steadying-servos", type: "augmentation", name: "Aim-Steadying Servos", origin: "Cybernetic", archetype: "Merc",
      summary: "Cancel drawbacks on ranged attack rolls",
      description: `You automatically cancel up to 2 drawbacks ([drawback][drawback]) when making a ranged physical attack.`,
    },
    {
      id: "complex-image-holoprojector", type: "augmentation", name: "Complex Image Holoprojector", origin: "Cybernetic", archetype: "Merc",
      summary: "Project vivid holograms",
      description: `You have a holographic projector built into your eyes, which allows you to project three-dimensional images drawn directly from your mind in stunning detail. The image you project is opaque but completely intangible, makes no noise, and can have any appearance or animation you can imagine. Creating an image uses your action in a conflict scene and remains present as long as you continue to spend your action to maintain it (or, as long as you wish, when in a non-conflict scene), vanishing if you go unconscious. The image can only appear in a place you can see clearly, and only at up close or near range; beyond that, the hologram diffuses too much to be convincing.`,
    },
    {
      id: "smart-link", type: "augmentation", name: "Smart Link", origin: "Cybernetic", archetype: "Merc",
      summary: "Take out more minions with ranged attacks",
      description: `Hits with physical ranged attacks against minions reduce the squad's size by 2 instead of by 1. Boons ([boon]) you roll on that attack reduce the squad's size by 1 more.`,
    },
    {
      id: "proximity-sensor-link", type: "augmentation", name: "Proximity Sensor Link", origin: "Cybernetic", archetype: "Operator",
      summary: "Gain a pool of temporary luck to protect you while driving/piloting",
      description: `You have a module that links directly into the sensors built into a vehicle or drone, giving you a preternatural sense of their surroundings. You can use a montage action to configure this link; Until the end of the job, you have a pool of 50 temporary luck that is depleted first whenever you hit by a physical attack while driving or piloting a vehicle, or when a drone you are piloting is hit by a physical attack. When that temporary luck is depleted, attacks once again begin depleting your own luck. You retain this temporary luck when you overlay an avatar sheet, but if you load your mind into an entirely new shell this pool goes away. This temporary pool's luck cannot be restored or increased in any way.`,
    },
    {
      id: "signal-jammer", type: "augmentation", name: "Signal Jammer", origin: "Cybernetic", archetype: "Operator",
      summary: "Force Administrator characters to re-roll",
      description: `Once per scene you are in, after the Administrator has rolled for an Administrator-controlled character to make a check or attack, you can force the Administrator to re-roll all of the dice (including advantage and challenge dice) and keep the second result.`,
    },
    {
      id: "vehicle-link", type: "augmentation", name: "Vehicle Link", origin: "Cybernetic", archetype: "Operator",
      summary: "Take an extra action to drive/pilot a vehicle",
      description: `While you are controlling a vehicle or drone during a conflict scene, when you succeed on your initiative check, you can take an action in both player initiative segments. One of those actions must involve making a Drive or Pilot Something check, which can be an attack if it is a physical melee attack using the vehicle or drone itself as a weapon (ramming, sideswiping, etc.). The vehicle or drone you are controlling may only move during one of the two crew member segments.`,
    },
    {
      id: "drone-appendage", type: "augmentation", name: "Drone Appendage", origin: "Cybernetic", archetype: "Thief",
      summary: "Detach your hand or eye as drones",
      description: `You have one hand and one eye that are completely mechanical. Each has internal batteries, sensors, and methods of locomotion that allow them to separate from your body and operate under your control remotely. Detaching one of your drone appendages requires the use of your action in a conflict scene. When detached, the eye or hand counts as a tiny automaton minion, which moves as you direct using your HUD. You can perceive visually through the eye when it is detached, and you can manipulate objects with your hand when it is detached, though neither can be used to make attacks of any kind. The appendages become inert if they are ever far from you, as your control signal becomes too weak to reach them; you can reattach them to your body when you are up close to them, which also requires the use of an action in a conflict scene. If your drone appendage takes any damage, it is broken and cannot be used again until it is repaired.`,
    },
    {
      id: "manipulator-prosthetic", type: "augmentation", name: "Manipulator Prosthetic", origin: "Cybernetic", archetype: "Thief",
      summary: "Gain an extra arm to help with complex tasks",
      description: `You have a small prosthetic manipulator arm that can perform basic tasks for you, attached to you back, ribs, or one of your existing arms. When not in use, this manipulator arm retracts into your body completely and is undetectable by visual inspection. The manipulator is strong enough to hold anything that could be held in a single hand, but is incapable of reliably making physical attacks. When you make a skill check and the manipulator could reasonably be of assistance, you may roll the percentile dice twice and keep either result.`,
    },
    {
      id: "retractable-wings", type: "augmentation", name: "Retractable Wings", origin: "Cybernetic", archetype: "Thief",
      summary: "Deploy steel wings to fly",
      description: `You have a pair of telescoping steel wings that fold and retract into storage in your back. You can deploy or stow these wings using your action in a conflict scene. While deployed, you can fly when you move, though you cannot hover in place. While your wings are deployed, you also have the **Difficulty in Tight Spaces** negative condition.`,
    },
    {
      id: "armor-plating", type: "augmentation", name: "Armor Plating", origin: "Cybernetic", archetype: null,
      description: `Whenever you take damage from a physical attack, reduce the damage by 10.`,
    },

    // ---- Gene-Spliced augmentations ----
    {
      id: "dragon-breath", type: "augmentation", name: "Dragon Breath", origin: "Gene-Spliced", archetype: "Assassin",
      summary: "Emit clouds of harmful chemicals",
      description: `Chemical-producing sacs have been grafted inside your chest and throat, which you can empty on a moment's notice by expelling these chemicals from your mouth. This is an area attack that affects all character that are either up close or near to you (you are immune to its effects), and in a conflict scene using this enhancement consumes your action. After using this perk, the effect you create lingers in the area where you used it as a hazard for the duration of the scene.

When you select this body augmentation, choose one of the following effects for the cloud of chemicals you expel:

- **Acrid Gas:** Any biological creature hit by the attack or the subsequent hazard's attack gains the **Sickened x2** negative condition.
- **Combustible Chemicals:** All targets hit by the attack (even non-biological ones) or the subsequent hazard take 20 damage from burning gas. Unlike other hazards, this damage does not increase over time.
- **Dense Ink Vapor:** This effect does not require attack rolls. The cloud of vapor you produce is opaque. Anyone inside the cloud has the **Obscured x4** condition.
- **Toxic Cloud:** Any target hit by the attack (even non-biological ones) or the subsequent hazard's attack gains or worsens the **Corroding** negative condition.

You can use this augmentation once each day. You can also choose to gain (or worsen) the **Exhausted** negative condition to use it one additional time in the same day.`,
    },
    {
      id: "hypertense-tendons", type: "augmentation", name: "Hypertense Tendons", origin: "Gene-Spliced", archetype: "Assassin",
      summary: "Move during both player initiative segments",
      description: `Your muscles have been enhanced for extra speed and agility. You can move once during each of the two player initiative segments.`,
    },
    {
      id: "melanophore-control", type: "augmentation", name: "Melanophore Control", origin: "Gene-Spliced", archetype: "Assassin",
      summary: "Blend into the background while you are standing still",
      description: `You can change the color and pattern of your skin at will, and can blend in against any unmoving background; in a conflict scene, doing so requires your action. Sensors within your clothing read signals from your skin and change color to match. While you are blending into the background, enemies add 2 challenge dice ([challenge][challenge]) to physical attacks made against you. This benefit ends when you move away from the object your are blending with.

You can also choose to gain (or worsen) the **Exhausted** negative condition to add 4 challenge dice ([challenge][challenge][challenge][challenge]) to the roll instead of 2.`,
    },
    {
      id: "enhanced-superarenal-glands", type: "augmentation", name: "Enhanced Superarenal Glands", origin: "Gene-Spliced", archetype: "Bruiser",
      summary: "Make an extra melee attack each round",
      description: `You endocrine system has been modified to create more potent and more carefully-tuned adrenaline output. When you succeed on your initiative check, you can take an action in both player initiative segments. One of those actions must involve making a melee attack, and you cannot attack the same target in both segments. You may only move during one of the two crew member segments.

You can also choose to gain (or worsen) the **Exhausted** negative condition to add 2 advantage dice ([advantage][advantage]) to the melee attack roll.`,
    },
    {
      id: "extreme-muscle-enhancement", type: "augmentation", name: "Extreme Muscle Enhancement", origin: "Gene-Spliced", archetype: "Bruiser",
      summary: "Project energy from your fists and feet",
      description: `Extensive gene therapy and chemical augmentation have given you a muscular physique that makes you seem like a giant among humans. When you roll less than a 25 on the percentile dice when making a physical melee attack, or when making a skill check to Break or Destroy Something, Lift or Move Something, Throw Something, or Tough it Out, treat those dice as if you had rolled a 25.

You can also choose to gain (or worsen) the **Exhausted** negative condition to treat a roll of less than 50 as if you had rolled a 50 in the above situation.`,
    },
    {
      id: "musculoskeletal-chemical-refinement", type: "augmentation", name: "Musculoskeletal Chemical Refinement", origin: "Gene-Spliced", archetype: "Bruiser",
      summary: "Take out more minions with melee attacks",
      description: `The chemical channels that relay commands from your brain to your muscles has been streamlined, allowing you to strike out with exceptional speed. Hits with physical melee attacks against minions reduce the squad's size by 2 instead of by 1. Boons ([boon]) you roll on that attack reduce the squad's size by 1 more.

You can also choose to gain (or worsen) the **Exhausted** negative condition to take out 3 minions with a hit instead of 2.`,
    },
    {
      id: "biohacking-suite", type: "augmentation", name: "Biohacking Suite", origin: "Gene-Spliced", archetype: "Doc",
      summary: "Create temporary wetware for your crew",
      description: `Your body can produce fine-tuned chemicals that, when triggered by configurations stored within your hive, can be extracted into single-use injections of wetware that your fellow human crew members can use. As a montage action, you can create a single-use biological program that can be activated by an injection, dermal patch, or other means of getting the chemicals into the human bloodstream. The program must be something that affects the physical, mental, or emotional state of a living thing through biological means; you choose one biological system or organ to be targeted by the wetware, and you must also describe at least one dangerous aspect of its use. When activated, that targeted biological system or organ gains the **Wetware Enhanced** positive condition, which lasts until the job ends or something ends the condition. The Administrator may describe additional mechanical effects for the program, and decide whether the effect you choose is setting-appropriate; if not, you may describe a different effect instead.`,
    },
    {
      id: "filtered-lungs", type: "augmentation", name: "Filtered Lungs", origin: "Gene-Spliced", archetype: "Doc",
      summary: "Become immune to airborne toxins, poisons, and diseases",
      description: `Your bronchial tubes have been enhanced with advanced filtering organs, allowing you to ignore harmful airborne chemicals that would be debilitating to others. You are immune to negative effects from airborne toxins, poisons, diseases, pollution, and other atmospheric sources.

When you select this augmentation, also add 2 noxious gas grenades (thrown weapons with the explosive and debilitating keywords) to your starting gear.`,
    },
    {
      id: "warning-sense", type: "augmentation", name: "Warning Sense", origin: "Gene-Spliced", archetype: "Doc",
      summary: "Sense the presence of danger before it strikes",
      description: `You cannot be surprised or snuck up on. Any attempt by another character to catch you unawares, whether by making a Sneak Around check or through other means, automatically fails. Additionally, when you fail your initiative roll, add 2 challenge dice ([challenge][challenge]) to all attacks against you that round.`,
    },
    {
      id: "bioelectricity", type: "augmentation", name: "Bioelectricity", origin: "Gene-Spliced", archetype: "Gearhead",
      summary: "Create bursts of electrical energy naturally",
      description: `Your body generates bioelectricity, which it stores in your cells until you choose to discharge it. You can deliver an electrical jolt to an object that you touch and choose one of the following benefits:

- As a part of making a check to progress an objective, add +20 to the impact of your roll
- When you make a digital attack to Crash a System or Override a System, you can add +20 to the damage of the attack from the interference generated by your bioelectric surge
- When you hit a target with a melee attack without a weapon, add +20 to the damage of the attack

Each time you use this augmentation, you can choose to gain (or worsen) the **Exhausted** negative condition once to increase the damage or impact to +40.`,
    },
    {
      id: "eagle-eyes", type: "augmentation", name: "Eagle Eyes", origin: "Gene-Spliced", archetype: "Gearhead",
      summary: "See clearly over great distances",
      description: `You can see up to five times as far as a normal human. You automatically cancel up to 2 drawbacks ([drawback][drawback]) on any roll made due to difficulty seeing something due to it being far away from you.`,
    },
    {
      id: "pack-instinct", type: "augmentation", name: "Pack Instinct", origin: "Gene-Spliced", archetype: "Gearhead",
      summary: "When you help someone, your minimum roll is 25",
      description: `Your mind has been spliced with aspects of pack animal DNA that strengthens the bond between you and your crew, allowing you to anticipate their moves and needs. When you roll less than a 25 on the percentile dice when making a roll to help someone else, treat those dice as if you had rolled a 25.

You can also choose to gain (or worsen) the **Exhausted** negative condition to treat a roll of less than 50 as if you had rolled a 50 in the above situation.`,
    },
    {
      id: "mask-of-many-faces", type: "augmentation", name: "Mask of Many Faces", origin: "Gene-Spliced", archetype: "Grifter",
      summary: "Change your appearance to look like someone else",
      description: `As a montage action, you can physically transform your appearance to look like a different living human indefinitely. You can either choose to make yourself simply have a different appearance, or you can choose one human you have seen and heard, transmuting your body shape, features, and voice to match theirs. If you choose to impersonate a specific person, while you have this appearance you have the **Impostor x2** negative condition; each subsequent montage scene action you spend studying the person and practicing their mannerisms reduces that negative condition by one step.`,
    },
    {
      id: "pheromone-emitter", type: "augmentation", name: "Pheromone Emitter", origin: "Gene-Spliced", archetype: "Grifter",
      summary: "Other humans up close to you become Swayed",
      description: `Other living beings that are up close to you have the **Swayed x2** condition unless they possess some means of protecting themselves against inhaled pheromones.

The first time you move up close to another living being, you can choose to gain (or worsen) the **Exhausted** negative condition to give that being gain the **Swayed x4** condition instead.`,
    },
    {
      id: "vocal-chord-graft", type: "augmentation", name: "Vocal Chord Graft", origin: "Gene-Spliced", archetype: "Grifter",
      summary: "Change and throw your voice",
      description: `You can alter your voice at will, making it softer, louder, higher, deeper, smoother, raspier, and so forth. Additionally, when you speak, you can make the sound seem as though it originates from any point within about one hundred feet of you. When you alter your voice as a part of making a check or mental attack to Convince Someone, Distract Someone, or Lie to Someone and you roll less than a 25 on the percentile dice, treat those dice as if you had rolled a 25.

You can also choose to gain (or worsen) the **Exhausted** negative condition to treat a roll of less than 50 as if you had rolled a 50 in the above situation.`,
    },
    {
      id: "low-friction-ion-channels", type: "augmentation", name: "Low-Friction Ion Channels", origin: "Gene-Spliced", archetype: "Hacker",
      summary: "Add challenge dice to digital attacks against you",
      description: `You can react quickly to electronic stimuli, making you better equipped to fend off digital attacks. Any digital attack made against you adds 2 challenge dice ([challenge][challenge]) to the roll.

You can also choose to gain (or worsen) the **Exhausted** negative condition to add 4 challenge dice ([challenge][challenge][challenge][challenge]) to the roll instead of 2.`,
    },
    {
      id: "parallel-neurons", type: "augmentation", name: "Parallel Neurons", origin: "Gene-Spliced", archetype: "Hacker",
      summary: "Make an extra digital attack each round",
      description: `You brain has been engineered to contain multiple independent sets of parallel neurons, giving you the ability to quickly process complex instructions. When you succeed on your initiative check, you can take an action in both player initiative segments. One of those actions must involve making a digital attack or a skill check to interface with a computer system in some way. You may only move during one of the two crew member segments.`,
    },
    {
      id: "trifurcated-cortex", type: "augmentation", name: "Trifurcated Cortex", origin: "Gene-Spliced", archetype: "Hacker",
      summary: "Gain advantage dice on digital attacks against minions",
      description: `Your prefrontal cortex has been manipulated to create additional processing power, which is exceptionally useful when dealing with automatons and other digital annoyances. When you make a digital attack against a squad of minions, you add 2 extra advantage dice ([advantage][advantage]) to the roll. You can also choose to gain (or worsen) the **Exhausted** negative condition to add 4 extra advantage dice ([advantage][advantage][advantage][advantage]) to the attack roll instead of 2.`,
    },
    {
      id: "kairomone-emitter", type: "augmentation", name: "Kairomone Emitter", origin: "Gene-Spliced", archetype: "Mastermind",
      summary: "Grant crew members a positive condition after helping them",
      description: `Your body produces engineered kairomones, which trigger subconscious responses in other members of your crew. After you help another non-synthetic crew member on a roll, for the rest of the scene that crew member has the **Supported x2** condition.

You can also choose to gain (or worsen) the **Exhausted** negative condition to give that ally the **Supported x4** condition instead.`,
    },
    {
      id: "predator-s-presence", type: "augmentation", name: "Predator's Presence", origin: "Gene-Spliced", archetype: "Mastermind",
      summary: "Gain advantage dice on mental attacks against minions",
      description: `Your body is augmented with aesthetic and pheromonal enhancements that can be triggered to project strength, danger, and authority that affect others subconsciously. When you make a mental attack against a squad of minions, you add 2 extra advantage dice ([advantage][advantage]) to the roll. You can also choose to gain (or worsen) the **Exhausted** negative condition to add 4 extra advantage dice ([advantage][advantage][advantage][advantage]) to the attack roll instead of 2.`,
    },
    {
      id: "superior-intellect", type: "augmentation", name: "Superior Intellect", origin: "Gene-Spliced", archetype: "Mastermind",
      summary: "Gain more information from Things You Know About",
      description: `Your brain has been engineered for maximum potential, allowing you to extrapolate complex knowledge from bare scraps of information. When the Administrator gives you information based on a Thing You Know About, you also gain one piece of information of the Administrator's choice from the A Little Digging section of that topic.`,
    },
    {
      id: "dragon-scales", type: "augmentation", name: "Dragon Scales", origin: "Gene-Spliced", archetype: "Merc",
      summary: "Take less damage fro physical attacks",
    },
    {
      id: "natural-weapons", type: "augmentation", name: "Natural Weapons", origin: "Gene-Spliced", archetype: "Merc",
      summary: "Gain claws, fangs, or another natural melee weapon",
      description: `You have been spliced with animal DNA and grown claws, fangs, quills, stingers, or some other form of natural defense mechanism that you describe. These natural weapons have a +10 bonus to damage, can be used to make melee or ranged attacks (the latter of which uses the Throw Something skill) depending on their form, and has the Compact keyword as well as 1 other keyword from the following list: debilitating, flechette (ranged only), jagged, or shock. You can select this augmentation multiple times, gaining a different natural weapon each time.

When you hit with an attack using these weapons, you can also choose to gain (or worsen) the **Exhausted** negative condition to add +30 to the damage of the attack instead of +10.`,
    },
    {
      id: "serpent-striker", type: "augmentation", name: "Serpent Striker", origin: "Gene-Spliced", archetype: "Merc",
      summary: "Gain advantage dice on melee attacks against minions",
      description: `Your muscles have been engineered to uncoil rapidly like a striking snake, allowing you to rapidly move between enemies when making melee strikes. When you make a melee attack against a squad of minions, you add 1 extra advantage die ([advantage]) to the roll. You can also choose to gain (or worsen) the **Exhausted** negative condition to add 3 extra advantage dice ([advantage][advantage][advantage]) to the attack roll instead of 1.`,
    },
    {
      id: "beast-wings", type: "augmentation", name: "Beast Wings", origin: "Gene-Spliced", archetype: "Operator",
      summary: "Bird or bat wings that allow you to fly alongside your drones",
      description: `You have a pair of feathered or bat-like wings that protrude from your back and fold up to a semi-manageable size. You can fly when you move, though you cannot hover in place. You always have the **Difficulty in Tight Spaces** negative condition.`,
    },
    {
      id: "four-dimensional-sense", type: "augmentation", name: "Four-Dimensional Sense", origin: "Gene-Spliced", archetype: "Operator",
      summary: "Cancel drawbacks while driving, transferring them to enemies",
      description: `When controlling a vehicle or drone, you automatically cancel up to 2 drawbacks ([drawback][drawback]) on any roll made to perform difficult maneuvers. If you are being pursued, you can instead transfer those drawbacks to one enemy of your choice, applying them to their next roll automatically.

You can also choose to gain (or worsen) the **Exhausted** negative condition to cancel and transfer up to 4 drawbacks ([drawback][drawback][drawback][drawback]) instead of 2.`,
    },
    {
      id: "g-force-adaptation", type: "augmentation", name: "G-Force Adaptation", origin: "Gene-Spliced", archetype: "Operator",
      summary: "Pull off extreme maneuvers, making your vehicle hard to hit",
      description: `Your muscles, circulatory system, and the parietal cortex of your brain have been strengthened and reinforced by genetic manipulation, a series of enhancements originally developed for astronauts and space colonists. You do not gain challenge dice on any roll as a result of being subjected to high gravity. Additionally, when you are driving or piloting a vehicle, you add 2 challenge dice ([challenge][challenge]) to any physical attack roll made against you, due to the intense maneuvers your body is capable and executing.

When an enemy attacks you while you are driving or piloting a vehicle, you can choose to gain (or worsen) the **Exhausted** negative condition to add 4 challenge dice ([challenge][challenge][challenge][challenge]) to the roll instead of 2.`,
    },
    {
      id: "compound-eyes", type: "augmentation", name: "Compound Eyes", origin: "Gene-Spliced", archetype: "Thief",
      summary: "Gain advantage dice on ranged attacks against minions",
      description: `Your eyes have been engineered to give you excellent depth perception and the ability to pick out enemies against any backdrop. When you make a ranged attack against a squad of minions, you add 2 extra advantage dice ([advantage][advantage]) to the roll. You can also choose to gain (or worsen) the **Exhausted** negative condition to add 4 extra advantage dice ([advantage][advantage][advantage][advantage]) to the roll instead of 2.`,
    },
    {
      id: "echolocation", type: "augmentation", name: "Echolocation", origin: "Gene-Spliced", archetype: "Thief",
      summary: "Reduce penalties for operating in darkness",
      description: `Your DNA has been augmented with segments derived from echolocating animals, giving you the ability to produce subsonic waves that allow you to "see" by processing the reflected sounds, even in total darkness. You automatically cancel up to 2 drawbacks ([drawback][drawback]) on any roll made due to difficulty seeing something due to darkness, fog, smoke, or other intangible obscurement.

When you select this augmentation, also add 2 smoke grenades (thrown weapons with the explosive and obfuscating keywords) to your starting gear.`,
    },
    {
      id: "prehensile-appendage", type: "augmentation", name: "Prehensile Appendage", origin: "Gene-Spliced", archetype: "Thief",
      summary: "Gain a tail or tentacle that helps with climbing and throwing",
      description: `Your body has been grafted with a tentacle or tail that is dexterous and strong enough to grasp, hold, and manipulate small objects. When you roll less than a 25 on the percentile dice when making a ranged attack with a thrown weapon, or when making a skill check to Climb, Jump, or Tumble, or to Fix or Modify Something, treat those dice as if you had rolled a 25.

You can also choose to gain (or worsen) the **Exhausted** negative condition to treat a roll of less than 50 as if you had rolled a 50 in the above situation.`,
    },
    {
      id: "ultraoxygenated-blood", type: "augmentation", name: "Ultraoxygenated Blood", origin: "Gene-Spliced", archetype: null,
      description: `Your blood has been modified to carry higher amounts of oxygen and the chemicals required to repair damage to your body. You heal 1 wound automatically at the start of each day. You ignore negative conditions caused by poisons, diseases, or toxins with a severity of x2 or less.`,
    },

    // ---- Psionic augmentations ----
    {
      id: "blink", type: "augmentation", name: "Blink", origin: "Psionic", archetype: "Assassin",
      summary: "Teleport over short distances",
      description: `When you move, you can spend 10 luck to teleport to your destination, provided that it is a place that you can see and is within the normal range of your movement. When you teleport in this way, it produces a sound akin to the air being forcibly sucked out of a room.`,
    },
    {
      id: "ethereal-blade", type: "augmentation", name: "Ethereal Blade", origin: "Psionic", archetype: "Assassin",
      summary: "Conjure a weapon made of psychic energy",
      description: `You can spend 10 luck to manifest a one- or two-handed melee weapon or a thrown weapon at will, coalescing a physical object out of psychic energy. The weapon takes any shape you wish, and you can conjure or dismiss it from existence at any time (even when it is not your turn in a conflict scene). Regardless of form, the weapon grants a bonus of +30 damage and has no additional keywords`,
    },
    {
      id: "levitation", type: "augmentation", name: "Levitation", origin: "Psionic", archetype: "Assassin",
      summary: "Float off the ground and move horizontally",
      description: `When you move, you can choose to spend 10 luck to levitate, hovering a short distance above the ground. During this movement, you cannot gain altitude significantly, though you can cross over deeper gaps (for example, the gap between two building rooftops) without having to make a skill check, provided that the place where you end your movement is at a comparable height as where you began. While levitating, you automatically avoid hazards on the ground, and can fall any distance without being harmed by the fall. If you end your movement while levitating, you gently descend to the ground.`,
    },
    {
      id: "corrective-measures", type: "augmentation", name: "Corrective Measures", origin: "Psionic", archetype: "Bruiser",
      summary: "Push your luck on melee attack rolls",
      description: `You can push your luck on melee attacks rolls; if you do, replace your percentile dice roll with the amount of luck you spent to push your luck when determining damage.`,
    },
    {
      id: "deflect-projectiles", type: "augmentation", name: "Deflect Projectiles", origin: "Psionic", archetype: "Bruiser",
      summary: "Halt or redirect projectiles fired at you",
      description: `When an enemy that you are aware of makes a physical ranged attack against you or a member of your crew, or a vehicle or drone you are controlling, you can spend 10 luck to raise a telekinetic barrier between yourself and the projectile, adding 4 challenge dice ([challenge][challenge][challenge][challenge]) to the attack roll. If the attack misses, for each drawback ([drawback]) rolled, deal 10 damage to the attacker as you redirect the projectile fired at you back at them.`,
    },
    {
      id: "silent-hammer", type: "augmentation", name: "Silent Hammer", origin: "Psionic", archetype: "Bruiser",
      summary: "Use telekinesis to dampen sound while breaking something",
      description: `You can direct a forceful telekinetic blow at an object or surface with the intention of breaking it while simultaneously suppressing all sound waves emanating from your target. When you make a roll to Break or Destroy Something, you can spend 10 luck to use this raw force; if you succeed, the act of breaking the object is completely silent.`,
    },
    {
      id: "aura-of-tranquility", type: "augmentation", name: "Aura of Tranquility", origin: "Psionic", archetype: "Doc",
      summary: "Prevent or end negative conditions tied to mental state",
      description: `You can project an aura of telepathic and telekinetic energy that washes over your allies and helps free them from the elements that ail them. As your action in a conflict scene, you can choose to spend 10 luck to end one negative condition on each character you choose that is up close or near to you. You describe how you use your psionic powers to end each negative condition.`,
    },
    {
      id: "precognitive-danger-sense", type: "augmentation", name: "Precognitive Danger Sense", origin: "Psionic", archetype: "Doc",
      summary: "Give an ally 20 luck when you roll for initiative",
      description: `When you roll for initiative, you gain a glimpse of the future. You can give yourself or one of your allies in the same scene a temporary pool of 20 luck that is depleted first, before their own luck when attacked. This temporary pool goes away at the end of the round, and cannot be replenished by any means once depleted. This temporary luck cannot be spent to activate psionic body augmentations.`,
    },
    {
      id: "sympathetic-regeneration", type: "augmentation", name: "Sympathetic Regeneration", origin: "Psionic", archetype: "Doc",
      summary: "Heal other peoples' wounds using your mind",
    },
    {
      id: "acumenopathy", type: "augmentation", name: "Acumenopathy", origin: "Psionic", archetype: "Gearhead",
      summary: "Use your current luck as your chance of success on a roll",
      description: `By opening your mind to the ebb and flow of ambient psychic energy, you can absorb expertise from the collective consciousness of all humans in the city. Whenever you would make any roll with percentile dice, you may first lose 10 luck and then use your new luck total as your chance of success on that roll.`,
    },
    {
      id: "psychometry", type: "augmentation", name: "Psychometry", origin: "Psionic", archetype: "Gearhead",
      summary: "Know about objects and their history by touching them",
      description: `When you physically hold an object and concentrate upon it, spending 10 luck, you can see visions of that object's history. You learn all basic information about that object, as well as anything that could be uncovered with A Little Digging, provided that it is something that the object was present for and that could be communicated in a vision. In a conflict scene, this requires the use of your action.`,
    },
    {
      id: "telekinesis", type: "augmentation", name: "Telekinesis", origin: "Psionic", archetype: "Gearhead",
      summary: "Manipulate objects at a distance",
      description: `You can spend 10 luck to use telekinesis to move and manipulate objects that you can see and that are up close or near to you without touching them. You cannot affect objects that are being held, and you cannot move objects that are secured in some way. You can manipulate the object in all of the same ways you could if you were physically interacting with it, though the Administrator may ask for skill checks (for example, to Lift or Move Something or to Throw Something) based on your description of how you are manipulating it to determine if you achieve the results you are intending. Your telekinetic strength is comparable to the physical strength of an unaugmented, but athletic, adult human.`,
    },
    {
      id: "deja-vu", type: "augmentation", name: "Déjà Vu", origin: "Psionic", archetype: "Grifter",
      summary: "Push your luck on mental attacks",
      description: `You can sense when your choices are about to fail you and course correct before disaster strikes. You can push your luck on mental attacks; if you do, replace your percentile dice roll with the amount of luck you spent to push your luck when determining damage.`,
    },
    {
      id: "mind-control", type: "augmentation", name: "Mind Control", origin: "Psionic", archetype: "Grifter",
      summary: "Affect the minds of humans, bending them to your will",
      description: `You can affect the mind of a living human in the same scene as you, bringing their thoughts and emotions under your control. You can make mental attacks using the Convince Someone skill to alter the thinking of another human in the same physical location as you. You do not need to speak to or interact with your target directly, though you must be able to see them. If your attack hits, you can spend any amount of luck, adding half of that amount as a bonus to the damage of the attack. If the attack reduces the target to 0 luck (or if you are attacking a target without luck) you permanently alter their thinking in the way you describe. If your attack misses, or does not do enough damage to reduce your target to 0 luck, the target becomes aware that they are under psychic assault and reacts accordingly.`,
    },
    {
      id: "mind-spike", type: "augmentation", name: "Mind Spike", origin: "Psionic", archetype: "Grifter",
      summary: "Make mental attacks by bombarding enemies with telepathy",
      description: `You can use focused psionic energy to directly attack the minds of others with such force to cause physical damage. As your action in a conflict scene, you can spend 10 luck to make a mental attack against a non-automaton enemy that you can see. Your chance of success on the attack is equal to your current luck, and you add +10 to the damage of the attack if it hits. Unlike other mental attacks, on a hit this attack causes physical pain and can cause wounds.`,
    },
    {
      id: "data-scramble", type: "augmentation", name: "Data Scramble", origin: "Psionic", archetype: "Hacker",
      summary: "Push your luck on digital attacks",
      description: `You can use psychic energy to disrupt and disperse electronic signals, allowing you to punch through a target's digital defenses. You can push your luck on digital attacks; if you do, replace your percentile dice roll with the amount of luck you spent to push your luck when determining damage.`,
    },
    {
      id: "technopathy", type: "augmentation", name: "Technopathy", origin: "Psionic", archetype: "Hacker",
      summary: "Telepathically interface with computer systems",
      description: `You can interface with computer systems telepathically. When you are up close or near to an object that is either computerized or connected electronically to a computer network, you can interact with it as though you had a hardwired connection to it through your hive. Attempts to trace your connection to the network will lead to the system you are interacting with but not directly to you.

You can also astrally project your mind into the Network, manifesting an avatar that is more like you than any digital avatar ever could be. When you enter the Network, you may choose the Astral Ghost avatar.`,
    },
    {
      id: "thrall", type: "augmentation", name: "Thrall", origin: "Psionic", archetype: "Hacker",
      summary: "Control a background character in a scene you are not in",
      description: `During a scene you are not in, you can spend 20 luck to choose a human Administrator-controlled character to be someone you have previously brought under your control via neuromancy. The character must be a minion or background character not pivotal to the scene. For the rest of the scene, you control how that character speaks and acts, and the character has a 50% chance of success for anything requiring a roll. Additionally, the character has the **Enthralled x2** negative condition. After the scene ends, this character cannot be chosen as the target of this augmentation again this job.`,
    },
    {
      id: "glamer", type: "augmentation", name: "Glamer", origin: "Psionic", archetype: "Mastermind",
      summary: "Create illusions that seem real",
      description: `You can bend light and manipulate sound waves to produce intangible illusionary images and sounds for the duration of a scene. You describe the appearance and sound of the illusion, then spend 10 luck and make a roll to Cover Your Tracks or Distract Someone (your choice) to see if you can achieve those exact effects. The illusion you create manifests where you direct it, but any physical interaction with part of the illusion reveals its true nature and causes this effect to end. The illusion is completely opaque and can be seen by electronics and synthetics, though it does not give off heat or have any weight, density, or internal structure, and any sensors capable of detecting or analyzing any of those traits will immediately reveal the ruse. In a conflict scene, this requires your action on your turn.`,
    },
    {
      id: "read-surface-thoughts", type: "augmentation", name: "Read Surface Thoughts", origin: "Psionic", archetype: "Mastermind",
      summary: "Draw information directly from the minds of other humans",
      description: `When you are in the same physical location as another Administrator-controlled human, you can read their surface thoughts. You can spend 10 luck to learn all basic information about that character, as well as anything that could be uncovered with A Little Digging, provided that it is something that the person whose mind you are reading would know about.`,
    },
    {
      id: "visions-of-the-future", type: "augmentation", name: "Visions of the Future", origin: "Psionic", archetype: "Mastermind",
      summary: "Substitute Administrator die rolls with predetermined ones",
      description: `As a montage action, you can spend time in meditation, looking into the flow of time to try and piece together a vision of future events. Roll percentile dice twice and mark down each of the results; you may swap the digits of each number rolled once before marking the result. Until the end of the job, you can substitute each of those numbers once for any roll just made by the Administrator, representing your vision of the future coming to fruition.`,
    },
    {
      id: "telekinetic-barrage", type: "augmentation", name: "Telekinetic Barrage", origin: "Psionic", archetype: "Merc",
      summary: "Attack enemies with a telepathically-hurled cloud of debris",
      description: `As your action in a conflict scene, you can spend 10 luck to make a roll to Throw Something by picking up objects and hurling them telepathically. The objects count as a ranged weapon (+30 damage) with the armor-piercing, concussive, and silent keywords, and you add 2 advantage dice ([advantage][advantage]) to the roll if you are targeting a squad of minions with the attack.`,
    },
    {
      id: "transmute-probability", type: "augmentation", name: "Transmute Probability", origin: "Psionic", archetype: "Merc",
      summary: "Add advantage dice to rolls made when you push your luck",
      description: `You can subtly bend the laws of reality, twisting fate in your favor even when the deck is stacked against you. When you push your luck, for every 10 luck you spend to increase your chance of success you also add one advantage die ([advantage]) to the roll, up to the maximum of four advantage dice on the roll. These dice are in addition to any challenge dice that you add to the roll for pushing your luck.`,
    },
    {
      id: "will-to-succeed", type: "augmentation", name: "Will to Succeed", origin: "Psionic", archetype: "Merc",
      summary: "Increase your chance of success by 20 when pushing your luck",
      description: `Your mind can achieve inhuman levels of focus, giving you an iron-clad force of will, and when you put your mind to something obstacles frequently fall away. When you push your luck on any roll, for every 10 luck you spend, increase your chance of success by 20 (instead of the normal 10).`,
    },
    {
      id: "alter-trajectory", type: "augmentation", name: "Alter Trajectory", origin: "Psionic", archetype: "Operator",
      summary: "Nudge incoming attacks using telekinesis",
      description: `You have a heightened sense of spatial awareness and can use telekinesis to quickly change the trajectory of an attack. When you or a member of your crew, or a vehicle or drone you are controlling, is targeted by a physical attack, you can spend 10 luck to add 2 challenge dice ([challenge][challenge]) to the attack roll. For each drawback ([drawback]) rolled, reduce the damage by 30. The attacker or the target of the attack must be up close or near to you in order to use this ability.`,
    },
    {
      id: "see-the-path", type: "augmentation", name: "See the Path", origin: "Psionic", archetype: "Operator",
      summary: "Sense the cleanest path through dangerous territory",
      description: `Whenever you would make a roll to avoid being harmed or otherwise affected by a hazard, you can choose spend 10 luck to automatically succeed on the roll instead of rolling dice. You may still mark the skill you would have used for the roll as "Used" for this session.`,
    },
    {
      id: "targeting-correction", type: "augmentation", name: "Targeting Correction", origin: "Psionic", archetype: "Operator",
      summary: "Push your luck on ranged attack rolls",
      description: `You can push your luck on ranged attack rolls; if you do, replace your percentile dice roll with the amount of luck you spent to push your luck when determining damage.`,
    },
    {
      id: "bend-space", type: "augmentation", name: "Bend Space", origin: "Psionic", archetype: "Thief",
      summary: "Open a portal to a place where you spent a montage action",
      description: `You can will space to fold itself in front of you, creating a portal between two locations. As a montage action, you can familiarize yourself with a physical location that you have unrestricted access to. During any subsequent scene this job, you can spend 10 luck to open a portal between your current location and the location you familiarized yourself with. Doing so in a conflict scene uses your action on your turn. The portal can be as small as one of your hands, or as large as a sports car, or anywhere in between (your choice) and the portal connects those spaces completely, allowing people, objects, and energy to pass through freely in both directions. The portal remains open until the end of the day, until you go unconscious, or until you choose to close it.`,
    },
    {
      id: "illusiveness", type: "augmentation", name: "Illusiveness", origin: "Psionic", archetype: "Thief",
      summary: "Force attack to fail by revealing illusions",
      description: `When you are hit by a physical attack, after the roll but before the attack is resolved you can spend 10 luck to force the Administrator to re-roll the attack. If the second roll misses, it reveals that the attack was actually made against an illusory duplicate of yours while you remained out of sight nearby.`,
    },
    {
      id: "shift-perspective", type: "augmentation", name: "Shift Perspective", origin: "Psionic", archetype: "Thief",
      summary: "Walk on walls or the ceiling",
      description: `You can reorient your perception of reality and shift the pull of gravity on yourself to walk on vertical surfaces or upside down below horizontal surfaces. You can use your action during a conflict scene to spend 10 luck and enable yourself to walk on walls or ceilings until the end of your turn. If you end your turn on such a surface, you can remain there in place as long as you do not move.`,
    },

    // ---- Synthetic augmentations ----
    {
      id: "extra-arms", type: "augmentation", name: "Extra Arms", origin: "Synthetic", archetype: "Assassin",
      summary: "Gain a second set of arms",
      description: `You have two extra arms and can hold up to four handfuls of things at a time. When you succeed on your initiative check, you can take an action in both player initiative segments. One of those actions must involve making a physical attack against a squad of minions, and you cannot attack the same squad of minions in both segments. You may only move during one of the two crew member segments.`,
    },
    {
      id: "rerouted-repairs", type: "augmentation", name: "Rerouted Repairs", origin: "Synthetic", archetype: "Assassin",
      summary: "No penalties for the Wounded condition",
      description: `Your body's critical systems have multiple backups and their functions can be rerouted to compensate for physical damage. The **Wounded** condition does not impose challenge dice ([challenge]) on your rolls at any severity.`,
    },
    {
      id: "subsonic-hypnotics-broadcaster", type: "augmentation", name: "Subsonic Hypnotics Broadcaster", origin: "Synthetic", archetype: "Assassin",
      summary: "Add the Dulled Awareness condition to nearby humans",
      description: `Your body is equipped with a broadcasting device that emits imperceptible audio waves that affects the brainwaves of nearby humans, dulling their senses and lulling them into complacency. Humans that are up close or near to you have the **Dulled Awareness** condition, which acts as a negative condition for them and a positive condition for you and any other non-humans in the scene. In a conflict scene, you can activate or deactivate this augmentation using your action.`,
    },
    {
      id: "butcher-s-gauntlet", type: "augmentation", name: "Butcher's Gauntlet", origin: "Synthetic", archetype: "Bruiser",
      summary: "Mount a large melee weapon on one arm",
      description: `You have a large melee weapon that is permanently mounted to one of your arms. While conspicuous, the weapon does not interfere with your day to day functions, though it is a constant warning to others not to mess with you. You gain a two-handed melee weapon with the Mounted keyword as a piece of starting gear (even though two-handed weapons cannot normally have the Mounted keyword, this one does). The weapon deals +30 damage when mounted (only +20 if you remove it) and you can choose one additional keyword for this weapon to have at the time you select this augmentation.`,
    },
    {
      id: "hulking-frame", type: "augmentation", name: "Hulking Frame", origin: "Synthetic", archetype: "Bruiser",
      summary: "Have a physically larger body",
      description: `You are the size of a small vehicle, which adds advantage or challenge dice to attack rolls as per the Vehicle Size table. Attacks you make against human-sized enemies automatically add 1 advantage die ([advantage]) to the roll, and attacks they make against you automatically add 1 challenge die ([challenge]) to the roll. You also have the **Oversized** condition, which is a condition that applies to any non-attack roll where your size could be a help (positive) or hindrance (negative).`,
    },
    {
      id: "kill-emitter", type: "augmentation", name: "Kill -9 Emitter", origin: "Synthetic", archetype: "Bruiser",
      summary: "Use Goad Someone and Intimidate Someone as digital attacks",
      description: `You can project visual, audio, and vibrational data that can be picked up by drone sensors and translated into commands, allowing you to affect automatons without having to access their programming directly. You can use the Goad Someone and Intimidate Someone skills against automatons (drones), provided that you are up close or near to them. If you use these skills to make attacks against those automatons, they are considered to be digital attacks.`,
    },
    {
      id: "neuromechanical-grafting-colony", type: "augmentation", name: "Neuromechanical Grafting Colony", origin: "Synthetic", archetype: "Doc",
      summary: "Create makeshift cybernetics from synthetic augmentations",
      description: `Your body contains a module that manufactures a special kind of nanite capable of grafting synthetic hardware onto living flesh. As a montage action, you can choose one synthetic augmentation and create a temporary cybernetic augmentation that has the same effect. You also choose a crew member in which you install that cybernetic augmentation, which remains installed in them for the rest of the job. The cybernetic augmentation imposes the **Unfamiliar Hardware** negative condition on the crew member in which it was installed.

When you use this augmentation, you must describe how it is feasible that the cybernetic version of the synthetic augmentation works with human biology. If the Administrator deems the explanation unfeasible, you can choose a different synthetic augmentation and come up with a new explanation.`,
    },
    {
      id: "rapid-defragmentation-core", type: "augmentation", name: "Rapid Defragmentation Core", origin: "Synthetic", archetype: "Doc",
      summary: "Restore luck to crewmates following a Network scene",
      description: `You have a dedicated co-processor installed in your body that can rapidly repair digital damage when connected to your crewmates' hives. At the conclusion of any scene taking place in the Network that you are a part of, you and all of your crewmates that were also in that scene regain 20 luck when you remove your overlaid avatar sheets.`,
    },
    {
      id: "seance-emulator", type: "augmentation", name: "Séance Emulator", origin: "Synthetic", archetype: "Doc",
      summary: "Access the memories and personality of a stored ghost",
      description: `You have a shielded partition in your mind that can be loaded with the digital ghost of another individual (human, or synthetic) and allow you to emulate that individual, functionally channeling that individual's consciousness and allowing them to speak and perceive through your body (though it cannot move or take any actions using your body). During a planning scene, you can load the ghost in your body and allow your crewmates to interact with it. While you are allowing your body to play host to the emulated consciousness, you cannot perceive what is happening, as it takes all of your body's processing power to emulate the ghost. The consciousness you are emulating is pliable and considers your crewmates to be allies and confidants, freely sharing any information it possesses with them.`,
    },
    {
      id: "adaptive-bios", type: "augmentation", name: "Adaptive BIOS", origin: "Synthetic", archetype: "Gearhead",
      summary: "Rewrite your code to shrug off unwanted conditions",
      description: `You possess the ability to self-upgrade your programming, creating new subroutines to help you adapt to whatever challenges are thrown at you. As a montage action, or as your action in a conflict scene, you can choose one condition that is affecting you or could potentially affect you in the future (except for the **Wounded** condition). For the rest of the job, that condition does not add challenge dice to any of your rolls.`,
    },
    {
      id: "external-i-o-connections", type: "augmentation", name: "External I/O Connections", origin: "Synthetic", archetype: "Gearhead",
      summary: "Upgrade the functionality of specialized electronic tools",
      description: `You have an array of cables and physical connectors that can interface with specialized computing devices, allowing you to boost their output by adding your own processing power to the device's. When you are up close to a commercial laptop or hacker's deck, you can choose to upgrade the quality of that specialized tool by one step (from improvised to standard, or from standard to exceptional. Additionally, at any time you can choose to temporarily make the tool into a hyper-specialized tool; you choose in which skill the tool becomes hyper-specialized, and the tool remains hyper-specialized until the end of the scene. If you are rendered unconscious or move to no longer be up close to the tool, it ceases to benefit from this augmentation.`,
    },
    {
      id: "proximity-based-packet-sensors", type: "augmentation", name: "Proximity-Based Packet Sensors", origin: "Synthetic", archetype: "Gearhead",
      summary: "Intercept the thoughts of nearby synthetic minds",
      description: `When you are up close to another Administrator-controlled synthetic, you can focus your sensors on that synthetic and detect the transmission of command packets within their electronic brain. You learn all basic information about that character, as well as anything that could be uncovered with A Little Digging, provided that it is something that the synthetic whose electronic brain you are remotely tapping into would know about.`,
    },
    {
      id: "artificial-cells", type: "augmentation", name: "Artificial Cells", origin: "Synthetic", archetype: "Grifter",
      summary: "Appear human to all but the deepest scans",
      description: `You have a self-replicating system of artificial cells that gives you a completely human appearance. You are imperceptibly different from a human to outward observation, and even biometric sensors will register you as a human. While any minor cuts, scrapes, and bruises all maintain the illusion, your true nature is revealed when you have the **Wounded** condition.`,
    },
    {
      id: "reconfigurable-exterior", type: "augmentation", name: "Reconfigurable Exterior", origin: "Synthetic", archetype: "Grifter",
      summary: "Change your physical appearance at-will",
      description: `You can rapidly change your outward appearance to look like a different synthetic being indefinitely. You can either choose to make yourself simply have a different appearance, or you can choose one synthetic you have seen and heard, transmuting your body shape, features, and voice to match theirs. If you choose to impersonate a specific synthetic, while you have this appearance you have the **Impostor x2** negative condition; each subsequent montage action you spend studying the person you are impersonating and practicing their mannerisms reduces that negative condition by one step.

**Special:** If you also have the Artificial Cells augmentation, you can use this perk to impersonate humans, not synthetics.`,
    },
    {
      id: "shielded-internal-storage", type: "augmentation", name: "Shielded Internal Storage", origin: "Synthetic", archetype: "Grifter",
      summary: "Keep objects on your person to avoid detection",
      description: `Part of your body is hollowed out and shielded from sensors, creature a secure storage location that blends in seamlessly with your body. This storage can hold objects up to the size of a pistol or other one-handed weapon, and any object inside the storage area is completely shielded from detection by sensors, electromagnetic interference, network connections, and physical interaction. The Administrator may still require you to succeed on a Conceal and Object roll to subtly stow or remove objects from your internal storage, but once inside the storage compartment you give no outward appearance of concealing the object, and even a physical search of your person does not reveal the presence of the shielded storage space.`,
    },
    {
      id: "blast-processing", type: "augmentation", name: "Blast Processing", origin: "Synthetic", archetype: "Hacker",
      summary: "Improve the damage of your digital attacks",
      description: `You have boosted processing power that lets you strike faster than your targets can anticipate. You deal +10 damage on digital attacks against non-minion enemies.`,
    },
    {
      id: "privacy-scrubber", type: "augmentation", name: "Privacy Scrubber", origin: "Synthetic", archetype: "Hacker",
      summary: "Halve the heat pool with a montage action",
      description: `You have a dedicated processing module that maintains a passive link to the Network, monitoring for data that identifies you or your crew and associated you with criminal action. As a montage action, you rapidly process the data you have stored, then deliver data-scrubbing scripts onto the Network that attempt to corrupt and delete any mention of your crew. The Administrator removes half of the heat ([heat]) from the heat pool.`,
    },
    {
      id: "surveillance-tap", type: "augmentation", name: "Surveillance Tap", origin: "Synthetic", archetype: "Hacker",
      summary: "Access the city-wide surveillance network to see other places",
      description: `You can tap into city-wide surveillance systems, including cameras, biometric sensors, motion sensors, wireless packet sniffers, and other intrusive forms of observation used by the corporations, police, and security forces to monitor the people of the city. During a scene you are not a part of, you can activate this augmentation to allow you to perceive the events of the scene, aggregating data from the various surveillance sources to give you a semi-complete, if not ideal, insight into what is happening. While you are doing so, you can make rolls to Analyze Data, Case the Joint, Read the Situation, or Size Someone up, and communicate with your fellow crew members in the scene as normal.`,
    },
    {
      id: "data-sifting-co-processor", type: "augmentation", name: "Data-Sifting Co-processor", origin: "Synthetic", archetype: "Mastermind",
      summary: "Temporarily gain a Thing You Know About",
      description: `You can make a data-only connection to the Network and rapidly download huge volumes of data on a given subject. As a montage action, you can choose one Thing You Know About to gain for the remainder of the job. Additionally, for the rest of the job, when the Administrator gives you basic information on a topic based on the Thing You Know About that you gained from this augmentation, they must also give you at least 1 piece of information from the A Little Digging section on that topic (if one exists).`,
    },
    {
      id: "electronic-sortilege-algorithm", type: "augmentation", name: "Electronic Sortilege Algorithm", origin: "Synthetic", archetype: "Mastermind",
      summary: "Use probability algorithms to predict outcomes",
      description: `As a montage action, you can attempt to predict the outcome of some decision or action you or your crew are considering. You describe to the Administrator the course of action you are considering, and then make a roll to Analyze Data or Read the Situation (your choice). If you succeed, the Administrator must truthfully reveal the most likely outcome of the course of action you are proposing, as well as any unforeseen aspects of the situation that affect your proposed action and contribute to the outcome.`,
    },
    {
      id: "lie-detector-core", type: "augmentation", name: "Lie Detector Core", origin: "Synthetic", archetype: "Mastermind",
      summary: "Identify when someone is lying and intuit the truth",
      description: `You have a sensor suite that rapidly processes visual and audio information to enable you to tell when another being is lying to you without having to roll dice. Additionally, if you succeed on a roll (Size Someone Up, or another skill that the Administrator deems appropriate), you are able to determine the truth by advanced deductive processing.`,
    },
    {
      id: "backup-battery", type: "augmentation", name: "Backup Battery", origin: "Synthetic", archetype: "Merc",
      summary: "Take two montage actions when you would take 1",
      description: `While humans sleep and other synthetics are recharging their shells, you are able to remain active and working toward your crew's goals thanks to deeper energy storage capacity. Whenever you choose to take a montage action instead of creating a legwork scene, take a second montage action immediately after that, representing the extra time you spent working on other tasks.`,
    },
    {
      id: "integreat-versioning-suite", type: "augmentation", name: "InteGreat Versioning Suite", origin: "Synthetic", archetype: "Merc",
      summary: "Take extra montage actions at the cost of heat",
      description: `Your default body's brain contains sophisticated integration conflict management software and version control tools that allow you to safely reintegrate your mind after splitting it into multiple copies, safely blending their new memories into a seamless whole.

At the start of any day (except for the final scene), you can declare that you are creating multiple digital copies of your mind and distributing them across the Network. For each copy you wish to make, add 4 heat ([heat][heat][heat][heat]) to the heat pool. That copy of you can take 1 montage action this day, which must be one of the following options: Go Shopping, Prepare (only tasks that can be performed in the Network), Research, or Use a Perk (only for perks that can be used in the Network).

Additionally, you may spend 1 influence ([influence]) to load any number of those copies into stock synthetic bodies, which allows you to choose from the following montage actions as well: Prepare (no digital-only restrictions), Recover, or Use a Perk (no digital-only restrictions).`,
    },
    {
      id: "transfigurable-weapon", type: "augmentation", name: "Transfigurable Weapon", origin: "Synthetic", archetype: "Merc",
      summary: "Part of your body transforms into a weapon",
      description: `You have a part of your body that rapidly reconfigures itself, revealing a weapon that is otherwise undetectable. You gain a pistol as a piece of starting gear. This weapon has the Mounted keyword, plus 2 keywords of your choice. You describe how your body reconfigures itself to reveal this weapon (an arm that transforms into the gun, a portion of your shoulder that opens up to reveal the weapon within, etc.), and you cannot be disarmed of this weapon unless your body is destroyed. When the weapon is not revealed, it cannot be fired, but also cannot be detected even by deep scans or advanced sensors.`,
    },
    {
      id: "autonomous-os", type: "augmentation", name: "Autonomous OS", origin: "Synthetic", archetype: "Operator",
      summary: "Deploy your body like a drone when you are in the Network",
      description: `Your body has a backup core with a simple (non-sentient) intelligence capable of performing simple tasks while your mind is occupied elsewhere. Whenever you create a legwork scene that takes place in a Network node, after the scene is completed you can have your body take 1 montage action of your choice; the montage action you describe must be something that the Administrator agrees could reasonably be done by a simple artificial intelligence, and you cannot use this action to Blow Off Steam or Cultivate Contacts. Your body uses your normal chance of success for any physical skills but rolls Anything Else for any non-physical skills if the action you wish it to take requires a skill check to succeed.`,
    },
    {
      id: "intellect-shard", type: "augmentation", name: "Intellect Shard", origin: "Synthetic", archetype: "Operator",
      summary: "Deploy a non-sentient portion of your intellect into the Network",
      description: `Your electronic brain can create reduced-capability versions of your mind that function as autonomous, though not truly sentient, programs. As a montage action, you can deploy one of these intellect shards into the Network or into a computer system you have access to. During any subsequent scene, at any time you can interrupt play to describe a single action that your intellect shard takes. The action you describe must be something that could be encompassed by a single action in a conflict scene, and can only be something that could be accomplished by a program or avatar in the Network or in the system into which your intellect shard was installed, even if you do not physically have access to the computer system at the time. The Administrator must agree that the action you describe is feasible, and decides if any skill roll must be made to determine success (if so, you make this skill roll using your chance of success and intrinsic advantage/challenge dice).`,
    },
    {
      id: "signal-interceptor", type: "augmentation", name: "Signal Interceptor", origin: "Synthetic", archetype: "Operator",
      summary: "Take over control of automated drones",
      description: `When you reduce a drone to 0 luck with a digital attack, you can immediately seize control of that drone. The drone takes its own turns, acts as you direct, and regains 50 luck. At the end of the scene, your hold over the drone ends (and the drone shuts down or otherwise exits the scene as you direct).`,
    },
    {
      id: "embedded-multitool", type: "augmentation", name: "Embedded Multitool", origin: "Synthetic", archetype: "Thief",
      summary: "Have a minimum impact of 25 when progressing objectives",
      description: `Hidden compartments throughout your hands, arms, and legs house a wide variety of highly specialized tools that you can call upon to help you deal with the challenges you face. When you roll less than a 25 on the percentile dice when making a skill check to progress an objective, treat those dice as if you had rolled a 25.`,
    },
    {
      id: "smartcells", type: "augmentation", name: "SmartCells", origin: "Synthetic", archetype: "Thief",
      summary: "Phase through solid objects by rapidly reconfiguring your cells",
      description: `Your body is composed of countless nanomachines that form the building blocks of your physical form on a pseudocellular level. These nanomachines, while largely inert most of the time, can periodically be made to rapidly reconfigure themselves in short bursts, allowing you to phase through solid objects by having your nanomachine cells rearrange themselves to pass through the molecules making up the object you are phasing through. Once per scene you can gain one of the following benefits:

- During your movement, you can pass through any solid objects that you choose to
- When you are hit with a physical attack, you allow the attack to harmlessly pass through you, reducing the damage to 0`,
    },
    {
      id: "tactile-power-siphon", type: "augmentation", name: "Tactile Power Siphon", origin: "Synthetic", archetype: "Thief",
      summary: "Gain a natural weapon with a +10 bonus to damage",
      description: `Your secure tactile networking contact points in the palms of your hands are augmented with power transfer cells, allowing you to drain the power from electrically-powered devices, such as electronic locks or security cameras, by touching them. When you use this ability to drain power as a part of the description of how you are making a skill check to progress an objective, add +20 to the impact of your roll. The Administrator must agree that the ability to drain power from something would reasonably contribute to overcoming the objective to use this augmentation.`,
    },
    {
      id: "consciousness-transmitter", type: "augmentation", name: "Consciousness Transmitter", origin: "Synthetic", archetype: null,
      description: `As a montage action, you can prep a mass-produced synthetic body with a dormant copy of your consciousness. During a subsequent day this job, you can choose non-sentient robot that has already been described as a part of the scene (or add one to the scene, provided that the Administrator agrees that its presence would be plausible) and transfer your consciousness to that body. You overlay a Quick Shell, creating a synthetic shell, and the body you were inhabiting becomes dormant; provided that your default body is not harmed or detained during that scene, you remove the quick shell at the end of the scene and re-inhabit your default body.`,
    },
    {
      id: "synthetic-body", type: "augmentation", name: "Synthetic Body", origin: "Synthetic", archetype: null,
      description: `You cannot be affected by poisons, diseases, and nonphysical psionic attacks and effects. This perk does not count toward your total number of body augmentations when calculating the XP cost of adding a new body augmentation.`,
    },
  ];
})(globalThis);
